"""Exécuteur de commandes pour l'agent (Phase 17).

Lance des commandes ARBITRAIRES (``pytest``, ``python x.py``, ``dotnet test``,
``ls``…) dans le dossier de workspace d'une session, capture stdout/stderr/exit
code avec un timeout strict.

⚠️ NIVEAUX D'ISOLATION
----------------------
Deux backends, même interface :

  - ``LocalExecutor``  : subprocess direct dans le workspace. Fonctionne
    immédiatement (dev solo), mais **PAS isolé** (la commande a les droits de
    l'utilisateur). À NE JAMAIS exposer en public / multi-utilisateur.

  - ``DockerExecutor`` : (à implémenter, Étape 0 du plan) lance la commande dans
    un conteneur éphémère — workspace monté en volume, ``--network none``,
    limites CPU/RAM/pids, user non-root. C'est le backend obligatoire avant
    tout déploiement.

L'agent parle à l'interface ``Executor``, donc on pourra swapper Local→Docker
sans toucher à la boucle.
"""
from __future__ import annotations

import logging
import os
import subprocess
import time
from dataclasses import dataclass
from typing import Protocol

from .workspace import Workspace


logger = logging.getLogger(__name__)

# Variables d'env transmises (minimum pour que python/dotnet/node tournent).
_ALLOWED_ENV = (
    "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "TEMP", "TMP",
    "USERPROFILE", "APPDATA", "LOCALAPPDATA", "HOMEDRIVE", "HOMEPATH",
    "DOTNET_ROOT", "DOTNET_CLI_HOME", "ProgramFiles", "ProgramFiles(x86)",
    "LANG", "LC_ALL",
)


@dataclass
class ExecResult:
    """Résultat structuré d'une commande — c'est l'« observation » de l'agent."""

    ok: bool               # True si exit_code == 0 et pas de timeout
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool = False
    truncated: bool = False


class Executor(Protocol):
    """Interface commune Local / Docker."""

    def run(self, command: str, timeout_s: float = 30.0) -> ExecResult: ...


def _build_env() -> dict[str, str]:
    env = {k: os.environ[k] for k in _ALLOWED_ENV if k in os.environ}
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    return env


def _truncate(text: str, max_bytes: int) -> tuple[str, bool]:
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= max_bytes:
        return text, False
    return encoded[:max_bytes].decode("utf-8", errors="replace") + "\n[... tronqué ...]", True


class LocalExecutor:
    """Exécute la commande en subprocess dans le workspace. NON isolé — dev solo."""

    def __init__(self, workspace: Workspace, max_output_bytes: int = 16 * 1024) -> None:
        self.workspace = workspace
        self.max_output_bytes = max_output_bytes

    def run(self, command: str, timeout_s: float = 30.0) -> ExecResult:
        if not command or not command.strip():
            return ExecResult(False, "", "(commande vide)", 1, 0)

        start = time.perf_counter()
        logger.info("[AGENT-EXEC] $ %s  (cwd=%s, timeout=%.0fs)",
                    command, self.workspace.session_id, timeout_s)
        try:
            proc = subprocess.run(
                command,
                shell=True,               # commandes arbitraires (pytest, &&, etc.)
                cwd=str(self.workspace.root),
                env=_build_env(),
                capture_output=True,
                text=False,
                timeout=timeout_s,
                stdin=subprocess.DEVNULL,
            )
            elapsed = int((time.perf_counter() - start) * 1000)
            out, t1 = _truncate(proc.stdout.decode("utf-8", "replace"), self.max_output_bytes)
            err, t2 = _truncate(proc.stderr.decode("utf-8", "replace"), self.max_output_bytes)
            return ExecResult(
                ok=proc.returncode == 0,
                stdout=out,
                stderr=err,
                exit_code=proc.returncode,
                elapsed_ms=elapsed,
                truncated=t1 or t2,
            )
        except subprocess.TimeoutExpired as exc:
            elapsed = int((time.perf_counter() - start) * 1000)
            out = exc.stdout.decode("utf-8", "replace") if exc.stdout else ""
            err = exc.stderr.decode("utf-8", "replace") if exc.stderr else ""
            out, _ = _truncate(out, self.max_output_bytes)
            err, _ = _truncate(err, self.max_output_bytes)
            logger.warning("[AGENT-EXEC] TIMEOUT après %.0fs : %s", timeout_s, command)
            return ExecResult(
                ok=False,
                stdout=out,
                stderr=(err + f"\n[timeout après {timeout_s:.0f}s]").strip(),
                exit_code=-1,
                elapsed_ms=elapsed,
                timeout=True,
            )
        except Exception as exc:
            elapsed = int((time.perf_counter() - start) * 1000)
            logger.exception("[AGENT-EXEC] erreur : %s", exc)
            return ExecResult(False, "", f"[erreur exécuteur : {exc}]", -2, elapsed)
