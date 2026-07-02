"""Workspace de session pour l'agent (Phase 17).

Chaque session agent possède un dossier isolé sous ``.agent_workspaces/<id>/``.
L'agent y écrit/lit/liste des fichiers via cette classe. Toutes les opérations
sont **path-jailed** : impossible de sortir du dossier de session (pas de
``../../etc/passwd``), même si le LLM tente un chemin malveillant.

Ce module ne fait QUE la manipulation de fichiers. L'exécution de commandes est
dans ``executor.py``. L'isolation renforcée (conteneur Docker) viendra
envelopper l'ensemble avant tout usage public — voir plan Phase 17, Étape 0.
"""
from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from ..config import PROJECT_ROOT


# Racine de tous les workspaces agent (gitignorée).
WORKSPACES_ROOT = PROJECT_ROOT / ".agent_workspaces"

# Garde-fous : taille max d'un fichier écrit, nombre max de fichiers listés.
_MAX_FILE_BYTES = 512 * 1024      # 512 Ko par fichier
_MAX_LIST_ENTRIES = 500


@dataclass
class FileResult:
    """Résultat structuré d'une opération fichier (consommé par la couche tools)."""

    ok: bool
    path: str = ""
    content: str = ""
    files: tuple[str, ...] = ()
    error: str | None = None


class Workspace:
    """Dossier de travail isolé pour une session agent."""

    def __init__(self, session_id: str) -> None:
        # session_id est nettoyé pour éviter toute traversée via l'id lui-même.
        safe_id = "".join(c for c in session_id if c.isalnum() or c in "-_")
        if not safe_id:
            raise ValueError("session_id invalide")
        self.session_id = safe_id
        self.root = (WORKSPACES_ROOT / safe_id).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------ jail
    def _resolve(self, rel_path: str) -> Path:
        """Résout un chemin relatif en absolu, en garantissant qu'il reste
        DANS le workspace. Lève ValueError sinon (protection anti-traversée)."""
        if not rel_path or rel_path.strip() == "":
            raise ValueError("chemin vide")
        # Interdit les chemins absolus explicites.
        candidate = (self.root / rel_path).resolve()
        root_str = str(self.root)
        cand_str = str(candidate)
        if cand_str != root_str and not cand_str.startswith(root_str + _sep()):
            raise ValueError(f"chemin hors du workspace : {rel_path}")
        return candidate

    # ------------------------------------------------------------------ ops
    def write_file(self, rel_path: str, content: str) -> FileResult:
        try:
            if content is None:
                content = ""
            encoded = content.encode("utf-8", errors="replace")
            if len(encoded) > _MAX_FILE_BYTES:
                return FileResult(
                    ok=False,
                    path=rel_path,
                    error=f"fichier trop gros (> {_MAX_FILE_BYTES // 1024} Ko)",
                )
            target = self._resolve(rel_path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            return FileResult(ok=True, path=self._rel(target))
        except (ValueError, OSError) as exc:
            return FileResult(ok=False, path=rel_path, error=str(exc))

    def read_file(self, rel_path: str) -> FileResult:
        try:
            target = self._resolve(rel_path)
            if not target.is_file():
                return FileResult(ok=False, path=rel_path, error="fichier introuvable")
            data = target.read_bytes()[: _MAX_FILE_BYTES + 1]
            if len(data) > _MAX_FILE_BYTES:
                text = data[:_MAX_FILE_BYTES].decode("utf-8", errors="replace")
                text += "\n\n[... fichier tronqué ...]"
            else:
                text = data.decode("utf-8", errors="replace")
            return FileResult(ok=True, path=self._rel(target), content=text)
        except (ValueError, OSError) as exc:
            return FileResult(ok=False, path=rel_path, error=str(exc))

    def list_files(self) -> FileResult:
        """Liste tous les fichiers du workspace (chemins relatifs, triés)."""
        try:
            out: list[str] = []
            for p in sorted(self.root.rglob("*")):
                if p.is_file():
                    out.append(self._rel(p))
                    if len(out) >= _MAX_LIST_ENTRIES:
                        break
            return FileResult(ok=True, files=tuple(out))
        except OSError as exc:
            return FileResult(ok=False, error=str(exc))

    def cleanup(self) -> None:
        """Supprime tout le dossier de session (fin d'agent)."""
        shutil.rmtree(self.root, ignore_errors=True)

    # ------------------------------------------------------------------ util
    def _rel(self, absolute: Path) -> str:
        """Chemin relatif au workspace, en slashes avant (portable)."""
        return str(absolute.relative_to(self.root)).replace("\\", "/")


def _sep() -> str:
    import os

    return os.sep
