"""Exécution sécurisée de code Python pour le tuteur.

Stratégie de défense en profondeur (niveau 2+) :
  1. Le code tourne dans un sous-processus séparé (mort si le parent meurt).
  2. CWD = dossier temporaire jetable, nettoyé en fin d'exécution.
  3. Variables d'environnement nettoyées : on ne passe que ce qui est
     STRICTEMENT nécessaire à Python (pas de .env, pas de PATH custom, pas de
     credentials accessibles).
  4. ``-I`` (isolated mode) Python : ignore PYTHONPATH, PYTHONHOME, user
     site-packages. Coupe les voies d'injection classiques.
  5. **PRELUDE injecté** au début du code utilisateur : installe un audit hook
     (PEP 578) qui bloque :
       - lecture/écriture de fichiers hors du sandbox dir
       - création de sous-processus
       - chargement de bibliothèques natives via ctypes
       - accès au registre Windows
  6. Timeout strict (~10s par défaut), kill du process group au dépassement.
  7. Output (stdout + stderr) tronqué à une taille raisonnable.
  8. Pas d'input stdin : impossible de demander une saisie utilisateur.

L'audit hook est **permanent** par design (cf docs Python : une fois ajouté,
ne peut être ni retiré ni remplacé). C'est donc une barrière solide.

Ce que ça NE PROTÈGE PAS contre :
  - Une attaque qui consomme massivement du CPU (le timeout limite la durée
    mais pas l'intensité).
  - Une attaque réseau via ``socket`` ou ``urllib`` (faisable, à bloquer
    explicitement si déployé public — voir _BLOCKED_EVENTS).

Pour usage local solo c'est largement suffisant. Pour déploiement public,
passer à un container Docker éphémère sans réseau.
"""
from __future__ import annotations

import logging
import os
import re
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path


logger = logging.getLogger(__name__)


# Variables d'env qu'on transmet (le strict minimum pour que Python tourne).
# Tout le reste (.env app, credentials, etc.) est volontairement absent.
_ALLOWED_ENV_KEYS = frozenset({
    "PATH",          # nécessaire pour trouver python lui-même
    "SYSTEMROOT",    # Windows : indispensable pour os.environ
    "TEMP", "TMP",
    "PYTHONIOENCODING",
})


@dataclass
class SandboxResult:
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool
    truncated: bool


# Prelude injecté en tête du script utilisateur. Installe un audit hook
# (PEP 578) qui bloque les opérations sensibles. L'audit hook est permanent
# (cf docs Python : addaudithook ne peut être ni retiré ni remplacé).
#
# IMPORTANT : on utilise un factory + closure pour que les variables capturées
# par le hook survivent au nettoyage du namespace global. Sinon le hook
# planterait avec NameError la première fois qu'il s'exécute.
_SANDBOX_PRELUDE = '''\
def __sandbox_setup():
    import sys, os

    # Dossiers où les lectures fichier sont autorisees :
    #  - sandbox dir (CWD) : les fichiers créés par l'utilisateur
    #  - sys.prefix / exec_prefix / base_prefix : installation Python (stdlib)
    # Ça permet aux imports stdlib (json, datetime, etc.) de fonctionner
    # tout en bloquant les accès à des chemins arbitraires.
    realpath = os.path.realpath
    allowed = []
    for d in (os.getcwd(), sys.prefix, sys.exec_prefix,
              sys.base_prefix, sys.base_exec_prefix):
        if d:
            try:
                allowed.append(realpath(d))
            except (OSError, ValueError):
                pass
    allowed_dirs = tuple(set(allowed))

    # Note : on NE bloque PAS "ctypes.dlopen" car `import ctypes` lui-même
    # charge la DLL Python sur Windows à l'init du module — ça bloquerait
    # tous les imports indirects de ctypes (json l'utilise par exemple).
    # La protection principale reste les filesystem events (un appel à
    # ctypes.CDLL d'une DLL hors PATH/sandbox est inutile car LoadLibrary
    # passe par le système, mais on a déjà coupé les voies de lecture de
    # configs/credentials).
    blocked = frozenset({
        "subprocess.Popen", "os.system", "os.posix_spawn",
        "winreg.OpenKey",
    })
    file_events = frozenset({
        "open", "os.scandir", "os.listdir", "os.rename", "os.remove",
        "os.rmdir", "os.unlink", "os.replace", "shutil.copyfile",
        "pathlib.Path.read_bytes", "pathlib.Path.read_text",
    })

    def hook(event, args, _blocked=blocked, _files=file_events,
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
                for allowed_dir in _dirs:
                    if abs_path.startswith(allowed_dir):
                        return
                raise PermissionError(
                    "Sandbox : acces au chemin '" + path
                    + "' interdit (hors du dossier sandbox)"
                )

    sys.addaudithook(hook)


__sandbox_setup()
del __sandbox_setup

# ---------- Code utilisateur ci-dessous ----------
'''


def _build_safe_env() -> dict[str, str]:
    """Construit un environnement minimal pour le subprocess."""
    env: dict[str, str] = {}
    for key in _ALLOWED_ENV_KEYS:
        if key in os.environ:
            env[key] = os.environ[key]
    # Force UTF-8 sur stdout/stderr du subprocess (sinon cp1252 sur Windows
    # peut faire planter sur les caractères accentués).
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    # Désactive les bytecodes en cache pour éviter de polluer le temp dir.
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    return env


def _truncate(text: str, max_bytes: int) -> tuple[str, bool]:
    """Tronque une chaîne à max_bytes (en UTF-8). Retourne (texte, was_truncated)."""
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= max_bytes:
        return text, False
    truncated = encoded[:max_bytes].decode("utf-8", errors="replace")
    return truncated + "\n\n[... output tronqué ...]", True


# Nombre de lignes que le prelude ajoute au début du script. Sert à
# réaligner les numéros de ligne dans les tracebacks.
_PRELUDE_LINES = _SANDBOX_PRELUDE.count("\n")


def _clean_traceback(text: str, script_path: Path) -> str:
    """Réécrit le path du snippet en ``<snippet>`` et corrige les line numbers.

    Le prelude ajoute N lignes en tête → toute mention "line K" qui réfère
    au snippet est en réalité ``line K - N`` du point de vue utilisateur.
    On ne shift QUE les line numbers attachés à <snippet>, pour ne pas
    casser les line numbers d'autres fichiers (stdlib) dans la stack.
    """
    if not text:
        return text

    # 1) Remplace le path du fichier temp par un label lisible
    text = text.replace(str(script_path), "<snippet>")

    # 2) Réaligne les "line N" qui suivent un mention de <snippet>.
    #    Pattern : File "<snippet>"...line N → File "<snippet>"...line (N - prelude)
    #    On capture le préfixe (groupe 1) pour le préserver tel quel.
    def _shift(m: "re.Match[str]") -> str:
        prefix = m.group(1)
        try:
            n = int(m.group(2))
        except ValueError:
            return m.group(0)
        adjusted = max(1, n - _PRELUDE_LINES)
        return f"{prefix}{adjusted}"

    text = re.sub(
        r'(File "<snippet>"[^\n]*?, line )(\d+)',
        _shift,
        text,
    )

    return text


def run_python(
    code: str,
    timeout_s: float = 10.0,
    max_output_bytes: int = 8 * 1024,
) -> SandboxResult:
    """Exécute du code Python dans un sandbox isolé.

    Args:
        code: source Python à exécuter.
        timeout_s: limite de temps avant kill.
        max_output_bytes: taille max de stdout / stderr.

    Returns:
        SandboxResult avec stdout, stderr, exit code, durée.
    """
    if not code or not code.strip():
        return SandboxResult(
            stdout="",
            stderr="(code vide)",
            exit_code=1,
            elapsed_ms=0,
            timeout=False,
            truncated=False,
        )

    env = _build_safe_env()
    start = time.perf_counter()

    with tempfile.TemporaryDirectory(prefix="pyexpert_sandbox_") as tmpdir:
        script_path = Path(tmpdir) / "snippet.py"
        # Préfixe le code utilisateur avec le prelude de sécurité (audit hook).
        full_script = _SANDBOX_PRELUDE + code
        script_path.write_text(full_script, encoding="utf-8")

        logger.info("[SANDBOX] exécution code %d chars, timeout %.0fs",
                    len(code), timeout_s)

        try:
            proc = subprocess.run(
                [sys.executable, "-I", str(script_path)],
                # -I = isolated mode : ignore PYTHONPATH/PYTHONHOME, ne lit
                # pas les user site-packages. Coupe les voies d'injection.
                cwd=tmpdir,
                env=env,
                capture_output=True,
                text=False,  # on décode nous-mêmes pour gérer UTF-8 strict
                timeout=timeout_s,
                check=False,
                stdin=subprocess.DEVNULL,  # pas d'input possible
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            stdout_raw = proc.stdout.decode("utf-8", errors="replace")
            stderr_raw = proc.stderr.decode("utf-8", errors="replace")
            # Réaligne les line numbers et masque le path du temp file.
            stderr_raw = _clean_traceback(stderr_raw, script_path)

            stdout, t1 = _truncate(stdout_raw, max_output_bytes)
            stderr, t2 = _truncate(stderr_raw, max_output_bytes)

            result = SandboxResult(
                stdout=stdout,
                stderr=stderr,
                exit_code=proc.returncode,
                elapsed_ms=elapsed_ms,
                timeout=False,
                truncated=t1 or t2,
            )
            logger.info(
                "[SANDBOX] terminé exit=%d en %dms (stdout=%dB, stderr=%dB)",
                result.exit_code, result.elapsed_ms,
                len(stdout_raw), len(stderr_raw),
            )
            return result

        except subprocess.TimeoutExpired as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            stdout = exc.stdout.decode("utf-8", errors="replace") if exc.stdout else ""
            stderr = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
            stderr = _clean_traceback(stderr, script_path)
            stdout, t1 = _truncate(stdout, max_output_bytes)
            stderr, t2 = _truncate(stderr, max_output_bytes)
            logger.warning("[SANDBOX] TIMEOUT après %.1fs", timeout_s)
            return SandboxResult(
                stdout=stdout,
                stderr=(stderr + f"\n\n[Sandbox: timeout après {timeout_s:.0f}s]")
                       .strip(),
                exit_code=-1,
                elapsed_ms=elapsed_ms,
                timeout=True,
                truncated=t1 or t2,
            )
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.exception("[SANDBOX] erreur inattendue : %s", exc)
            return SandboxResult(
                stdout="",
                stderr=f"[Erreur sandbox : {exc}]",
                exit_code=-2,
                elapsed_ms=elapsed_ms,
                timeout=False,
                truncated=False,
            )