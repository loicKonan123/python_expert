"""Kernel Python persistant pour le tuteur — style Jupyter.

Architecture :
  - PythonKernel : un sous-processus Python long-lived qui boucle sur stdin,
    exécute le code reçu via exec() dans un namespace persistant, et écrit
    stdout/stderr délimités par des markers.
  - KernelManager : pool de kernels indexés par session_id (= id de conversation
    côté frontend). Avec TTL d'inactivité pour libérer la RAM.

Sécurité : chaque kernel installe le même audit hook PEP 578 que le sandbox
one-shot (cf backend/sandbox.py). Les protections sont identiques :
  - lecture/écriture fichiers bloquée hors sandbox + Python install
  - subprocess / os.system / winreg bloqués
  - dossier temp jetable, env nettoyé

Protocole stdin/stdout entre backend et kernel :
  Backend envoie :
      <code utilisateur>
      \\n___PYEXPERT_RUN___\\n
  Kernel répond avec :
      stdout du exec, suivi de :
      \\n___PYEXPERT_END___<exit_code>\\n
      stderr du exec (sur fd 2), suivi de :
      \\n___PYEXPERT_END___\\n
"""
from __future__ import annotations

import logging
import os
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from queue import Queue, Empty
from typing import Optional


logger = logging.getLogger(__name__)


# ============================================================================
# Constantes du protocole
# ============================================================================
_RUN_MARKER = "___PYEXPERT_RUN___"
_END_MARKER = "___PYEXPERT_END___"

# Durée maximale d'une exécution unique avant qu'on tue + restart le kernel
DEFAULT_EXEC_TIMEOUT_S = 10.0
# Inactivité au-delà de laquelle on libère le kernel
DEFAULT_IDLE_TTL_S = 600.0
# Sortie max par exécution
DEFAULT_MAX_OUTPUT_BYTES = 8 * 1024


# ============================================================================
# Code du runner (exécuté DANS le subprocess kernel)
# ============================================================================
# C'est ce que le subprocess Python exécute. Il contient l'audit hook +
# la boucle de lecture stdin / exec / écriture stdout-stderr-markers.
_KERNEL_RUNNER = '''
import sys, os, io, traceback, contextlib

# ----- ENCODAGE I/O ROBUSTE -----
# On force UTF-8 + errors='replace' pour que les octets bizarres deviennent
# U+FFFD au lieu de produire des surrogates (\\udc**) qui crashent à la
# ré-écriture vers le parent. Sans ça, des caractères accentués / emoji
# dans le code utilisateur peuvent faire planter le runner sur Windows.
for stream_name in ("stdin", "stdout", "stderr"):
    stream = getattr(sys, stream_name)
    if hasattr(stream, "reconfigure"):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError):
            pass

# ----- AUDIT HOOK (identique à sandbox.py) -----
realpath = os.path.realpath
allowed_dirs = []
for d in (os.getcwd(), sys.prefix, sys.exec_prefix,
          sys.base_prefix, sys.base_exec_prefix):
    if d:
        try:
            allowed_dirs.append(realpath(d))
        except (OSError, ValueError):
            pass
allowed_dirs = tuple(set(allowed_dirs))

BLOCKED = frozenset({{
    "subprocess.Popen", "os.system", "os.posix_spawn",
    "winreg.OpenKey",
}})
FILE_EVENTS = frozenset({{
    "open", "os.scandir", "os.listdir", "os.rename", "os.remove",
    "os.rmdir", "os.unlink", "os.replace", "shutil.copyfile",
    "pathlib.Path.read_bytes", "pathlib.Path.read_text",
}})

def _audit(event, args, _blocked=BLOCKED, _files=FILE_EVENTS,
           _dirs=allowed_dirs, _realpath=realpath):
    if event in _blocked:
        raise PermissionError("Sandbox : operation '" + event + "' interdite")
    if event in _files and args:
        path = args[0]
        if isinstance(path, bytes):
            try:
                path = path.decode("utf-8")
            except UnicodeDecodeError:
                raise PermissionError("Sandbox : chemin non decodable")
        if isinstance(path, str):
            try:
                abs_path = _realpath(path)
            except (OSError, ValueError):
                return
            for d in _dirs:
                if abs_path.startswith(d):
                    return
            raise PermissionError(
                "Sandbox : acces au chemin '" + path + "' interdit"
            )

sys.addaudithook(_audit)

# ----- NAMESPACE PERSISTANT -----
# C'est ICI que vivent les variables / classes / imports entre les Run.
__user_ns = {{"__name__": "__main__"}}

RUN_MARKER = {run_marker!r}
END_MARKER = {end_marker!r}


def _read_code_block():
    """Lit stdin jusqu'à RUN_MARKER. Retourne le code accumulé."""
    buf = []
    while True:
        line = sys.stdin.readline()
        if not line:  # EOF — le backend a ferme la stdin
            return None
        if line.rstrip("\\n") == RUN_MARKER:
            return "".join(buf)
        buf.append(line)


def _emit_end(stream, code):
    """Marque la fin de stdout (avec code) ou stderr. Flush imperatif."""
    stream.write("\\n" + END_MARKER + str(code) + "\\n")
    stream.flush()


# ----- BOUCLE PRINCIPALE -----
sys.stdout.write("__PYEXPERT_KERNEL_READY__\\n")
sys.stdout.flush()

while True:
    code = _read_code_block()
    if code is None:
        break  # stdin ferme = backend coupe la session

    exit_code = 0
    # On capture stdout et stderr pendant l'exec dans des StringIO,
    # puis on flush vers les vrais streams avec le marker.
    out_buf = io.StringIO()
    err_buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(out_buf), contextlib.redirect_stderr(err_buf):
            try:
                # On essaie d'abord en mode "single" pour que les expressions
                # en dernière ligne affichent leur valeur (comme un REPL).
                # Si ça échoue (multi-statement), on tombe en mode "exec".
                try:
                    compiled = compile(code, "<snippet>", "single")
                except SyntaxError:
                    compiled = compile(code, "<snippet>", "exec")
                exec(compiled, __user_ns)
            except SystemExit:
                pass
            except BaseException:
                exit_code = 1
                traceback.print_exc()
    except BaseException as exc:
        # Erreur du framework lui-même — on essaie de la signaler
        err_buf.write("[Kernel error: %s]" % exc)
        exit_code = 2

    # Émission ordonnée : stdout d'abord (puis END), puis stderr (puis END).
    sys.stdout.write(out_buf.getvalue())
    _emit_end(sys.stdout, exit_code)

    sys.stderr.write(err_buf.getvalue())
    _emit_end(sys.stderr, "")
'''.format(run_marker=_RUN_MARKER, end_marker=_END_MARKER)


# ============================================================================
# Données de retour
# ============================================================================
@dataclass
class KernelResult:
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool
    truncated: bool
    session_id: str
    restarted: bool = False  # True si on a dû tuer + recréer le kernel


# ============================================================================
# Helpers env
# ============================================================================
_ALLOWED_ENV_KEYS = frozenset({
    "PATH", "SYSTEMROOT", "TEMP", "TMP", "PYTHONIOENCODING",
})


def _build_safe_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for key in _ALLOWED_ENV_KEYS:
        if key in os.environ:
            env[key] = os.environ[key]
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["PYTHONUNBUFFERED"] = "1"  # critique : sinon stdin/stdout buffering casse le protocole
    return env


def _truncate(text: str, max_bytes: int) -> tuple[str, bool]:
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= max_bytes:
        return text, False
    truncated = encoded[:max_bytes].decode("utf-8", errors="replace")
    return truncated + "\n\n[... output tronqué ...]", True


# ============================================================================
# PythonKernel
# ============================================================================
class PythonKernel:
    """Un kernel Python persistant attaché à une session.

    Encapsule un subprocess long-lived. Communique via stdin/stdout avec
    des markers pour délimiter les exécutions.

    Pas thread-safe : on suppose qu'un seul execute() est en cours à la fois
    par kernel (le KernelManager force ça avec un Lock).
    """

    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.created_at = time.time()
        self.last_used_at = self.created_at
        self.exec_count = 0
        self._tmpdir = tempfile.TemporaryDirectory(prefix=f"pyexpert_kernel_{session_id[:8]}_")
        self._proc: Optional[subprocess.Popen[bytes]] = None
        self._stdout_q: Queue[bytes] = Queue()
        self._stderr_q: Queue[bytes] = Queue()
        self._reader_threads: list[threading.Thread] = []
        self._lock = threading.Lock()  # un exec à la fois
        self._start()

    # ------------------------------------------------------------------ start
    def _start(self) -> None:
        logger.info("[KERNEL %s] démarrage", self.session_id[:8])
        self._proc = subprocess.Popen(
            [sys.executable, "-u", "-I", "-c", _KERNEL_RUNNER],
            cwd=self._tmpdir.name,
            env=_build_safe_env(),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0,  # unbuffered
        )

        # Threads de lecture asynchrones : sinon on risque le deadlock si
        # le kernel écrit > 4 KB sans qu'on lise.
        def _drain(pipe, q: Queue) -> None:
            assert pipe is not None
            while True:
                chunk = pipe.readline()
                if not chunk:
                    q.put(b"")  # sentinel EOF
                    return
                q.put(chunk)

        for stream, q in ((self._proc.stdout, self._stdout_q),
                          (self._proc.stderr, self._stderr_q)):
            t = threading.Thread(target=_drain, args=(stream, q), daemon=True)
            t.start()
            self._reader_threads.append(t)

        # Attend le signal "ready" du kernel (~ 100 ms)
        ready_deadline = time.time() + 5.0
        while time.time() < ready_deadline:
            try:
                line = self._stdout_q.get(timeout=0.1)
                if b"__PYEXPERT_KERNEL_READY__" in line:
                    logger.info("[KERNEL %s] prêt", self.session_id[:8])
                    return
            except Empty:
                continue
        # Pas de "ready" reçu → kernel mort-né
        raise RuntimeError(f"Kernel {self.session_id[:8]} : pas de signal ready en 5s")

    # -------------------------------------------------------------- alive ?
    @property
    def alive(self) -> bool:
        return self._proc is not None and self._proc.poll() is None

    # ---------------------------------------------------------------- exec
    def execute(
        self,
        code: str,
        timeout_s: float = DEFAULT_EXEC_TIMEOUT_S,
        max_output_bytes: int = DEFAULT_MAX_OUTPUT_BYTES,
    ) -> KernelResult:
        """Envoie un bloc de code au kernel et retourne le résultat."""
        if not self.alive:
            raise RuntimeError(f"Kernel {self.session_id[:8]} mort")

        with self._lock:
            self.last_used_at = time.time()
            self.exec_count += 1
            start = time.perf_counter()

            assert self._proc is not None and self._proc.stdin is not None
            # On envoie le code + marker pour signaler la fin du bloc.
            payload = code if code.endswith("\n") else code + "\n"
            payload += _RUN_MARKER + "\n"
            try:
                self._proc.stdin.write(payload.encode("utf-8", errors="replace"))
                self._proc.stdin.flush()
            except (BrokenPipeError, OSError) as exc:
                raise RuntimeError(f"Kernel {self.session_id[:8]} stdin broken : {exc}")

            # On lit stdout jusqu'au END marker (qui inclut l'exit code)
            stdout, exit_code, timed_out = self._read_until_end(
                self._stdout_q,
                deadline=time.time() + timeout_s,
                want_exit_code=True,
            )
            # Puis stderr jusqu'à son END marker
            stderr, _, stderr_timed_out = self._read_until_end(
                self._stderr_q,
                deadline=time.time() + (timeout_s if not timed_out else 2.0),
                want_exit_code=False,
            )

            elapsed_ms = int((time.perf_counter() - start) * 1000)
            # Normalise les fins de ligne Windows et retire les \r isolés que
            # le buffering subprocess peut laisser traîner.
            stdout = stdout.replace("\r\n", "\n").replace("\r", "").rstrip()
            stderr = stderr.replace("\r\n", "\n").replace("\r", "").rstrip()
            stdout, t1 = _truncate(stdout, max_output_bytes)
            stderr, t2 = _truncate(stderr, max_output_bytes)

            if timed_out:
                logger.warning("[KERNEL %s] TIMEOUT après %.1fs", self.session_id[:8], timeout_s)

            return KernelResult(
                stdout=stdout,
                stderr=stderr,
                exit_code=exit_code,
                elapsed_ms=elapsed_ms,
                timeout=timed_out or stderr_timed_out,
                truncated=t1 or t2,
                session_id=self.session_id,
            )

    def _read_until_end(
        self,
        q: Queue,
        deadline: float,
        want_exit_code: bool,
    ) -> tuple[str, int, bool]:
        """Lit la queue jusqu'au END marker. Retourne (texte, exit_code, timeout)."""
        buf: list[str] = []
        exit_code = 0
        while time.time() < deadline:
            try:
                chunk = q.get(timeout=0.1)
            except Empty:
                continue
            if not chunk:
                # EOF du subprocess
                return "".join(buf), exit_code, True
            line = chunk.decode("utf-8", errors="replace")
            # Détection du END marker (inline ou en début de ligne)
            idx = line.find(_END_MARKER)
            if idx != -1:
                buf.append(line[:idx])
                # Ce qui suit le marker est l'exit code (digits) + \n
                after = line[idx + len(_END_MARKER):].strip()
                if want_exit_code and after:
                    try:
                        exit_code = int(after)
                    except ValueError:
                        exit_code = 0
                # Retire un trailing \n du buffer
                text = "".join(buf)
                if text.endswith("\n"):
                    text = text[:-1]
                return text, exit_code, False
            buf.append(line)
        return "".join(buf), exit_code, True  # timeout

    # --------------------------------------------------------------- close
    def close(self) -> None:
        """Tue le subprocess et nettoie."""
        if self._proc and self.alive:
            logger.info("[KERNEL %s] arrêt (après %d exec)",
                        self.session_id[:8], self.exec_count)
            try:
                self._proc.terminate()
                try:
                    self._proc.wait(timeout=2.0)
                except subprocess.TimeoutExpired:
                    self._proc.kill()
                    self._proc.wait(timeout=2.0)
            except Exception as exc:
                logger.warning("[KERNEL %s] erreur close: %s", self.session_id[:8], exc)
        try:
            self._tmpdir.cleanup()
        except Exception:
            pass


# ============================================================================
# KernelManager
# ============================================================================
class KernelManager:
    """Pool de kernels indexés par session_id. Thread-safe.

    Crée à la demande, tue après TTL d'inactivité. Permet aussi un restart
    explicite (utile quand le user clique « Reset » dans l'UI).
    """

    def __init__(self, idle_ttl_s: float = DEFAULT_IDLE_TTL_S) -> None:
        self._kernels: dict[str, PythonKernel] = {}
        self._lock = threading.Lock()
        self.idle_ttl_s = idle_ttl_s

    def get_or_create(self, session_id: str) -> PythonKernel:
        with self._lock:
            self._evict_stale_locked()
            k = self._kernels.get(session_id)
            if k is not None and k.alive:
                return k
            if k is not None:
                # mort — on nettoie
                k.close()
                del self._kernels[session_id]
            logger.info("[KernelManager] création kernel pour session %s", session_id[:8])
            new_k = PythonKernel(session_id)
            self._kernels[session_id] = new_k
            return new_k

    def restart(self, session_id: str) -> PythonKernel:
        """Tue le kernel existant et en crée un neuf pour la session."""
        with self._lock:
            k = self._kernels.pop(session_id, None)
            if k is not None:
                logger.info("[KernelManager] restart kernel session %s", session_id[:8])
                k.close()
            new_k = PythonKernel(session_id)
            self._kernels[session_id] = new_k
            return new_k

    def shutdown_all(self) -> None:
        with self._lock:
            for k in list(self._kernels.values()):
                k.close()
            self._kernels.clear()

    def _evict_stale_locked(self) -> None:
        """Tue les kernels inactifs depuis plus de idle_ttl_s. Lock déjà tenu."""
        now = time.time()
        dead: list[str] = []
        for sid, k in self._kernels.items():
            if not k.alive or (now - k.last_used_at) > self.idle_ttl_s:
                dead.append(sid)
        for sid in dead:
            logger.info("[KernelManager] éviction kernel session %s (inactif)", sid[:8])
            self._kernels[sid].close()
            del self._kernels[sid]

    def stats(self) -> dict:
        with self._lock:
            return {
                "active_kernels": len(self._kernels),
                "sessions": [
                    {
                        "session_id": k.session_id,
                        "exec_count": k.exec_count,
                        "uptime_s": round(time.time() - k.created_at, 1),
                        "idle_s": round(time.time() - k.last_used_at, 1),
                    }
                    for k in self._kernels.values()
                ],
            }


# Singleton attaché à l'app FastAPI au startup
_manager: KernelManager | None = None


def get_manager() -> KernelManager:
    global _manager
    if _manager is None:
        _manager = KernelManager()
    return _manager


def new_session_id() -> str:
    """Génère un id de session unique (utilisé par le frontend si aucun id fourni)."""
    return f"sess-{uuid.uuid4().hex[:12]}"
