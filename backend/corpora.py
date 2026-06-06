"""Manifeste des corpus documentaires indexés par le RAG.

Chaque entrée décrit une source de documentation officielle :
  - où la récupérer (git URL + sous-chemin),
  - où elle vit localement,
  - dans quel format elle est écrite (sphinx-text, markdown, rst, mdx),
  - quels fichiers scanner.

Pour ajouter une techno, il suffit d'ajouter une entrée dans CORPORA puis :
  1. `python -m backend.scripts.fetch_docs --corpus <nom>`  (clone/update)
  2. `python -m backend.scripts.build_index`                (réindexe tout)
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .config import PROJECT_ROOT


DocFormat = Literal["sphinx-text", "markdown", "rst", "mdx", "code"]


@dataclass(frozen=True)
class Corpus:
    """Description d'un corpus documentaire ou de code source."""

    name: str                      # identifiant court ("python", "fastapi", "self"...)
    description: str               # nom humain
    local_path: Path               # dossier local où les fichiers vivent
    format: DocFormat              # format des fichiers
    file_extensions: tuple[str, ...]  # extensions à scanner

    # --- Pour fetch_docs.py (optionnel — si non défini, le corpus est local-only) ---
    source_repo: str | None = None     # URL git
    source_branch: str | None = None   # branche / tag
    source_subpath: str | None = None  # chemin DANS le repo

    # Patterns de chemins à ignorer (récursif). Sert pour le corpus de code
    # afin d'éviter d'indexer node_modules, .next, etc.
    exclude_patterns: tuple[str, ...] = ()

    @property
    def is_remote(self) -> bool:
        return self.source_repo is not None


# Tous les corpus connus. L'ordre n'a pas d'importance — chaque chunk porte son
# corpus en métadonnée et la recherche se fait sur l'ensemble par défaut.
DOCS_ROOT = PROJECT_ROOT / "docs-sources"

CORPORA: dict[str, Corpus] = {

    # --------------------------------------------------------- Python officiel
    "python": Corpus(
        name="python",
        description="Python 3.14 (référence officielle)",
        # On garde l'emplacement historique pour ne pas casser l'existant.
        local_path=PROJECT_ROOT / "python-3.14-docs-text",
        format="sphinx-text",
        file_extensions=(".txt",),
        # Téléchargeable depuis https://docs.python.org/3.14/download.html
        # (pas un repo git facile à cloner — l'utilisateur télécharge l'archive).
    ),

    # --------------------------------------------------------------- FastAPI
    "fastapi": Corpus(
        name="fastapi",
        description="FastAPI",
        local_path=DOCS_ROOT / "fastapi",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/fastapi/fastapi.git",
        source_branch="master",
        source_subpath="docs/en/docs",
    ),

    # --------------------------------------------------------------- Pydantic
    "pydantic": Corpus(
        name="pydantic",
        description="Pydantic v2",
        local_path=DOCS_ROOT / "pydantic",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/pydantic/pydantic.git",
        source_branch="main",
        source_subpath="docs",
    ),

    # ---------------------------------------------------------------- Next.js
    "nextjs": Corpus(
        name="nextjs",
        description="Next.js (App Router)",
        # Déjà disponible localement via npm install — pas besoin de cloner.
        local_path=PROJECT_ROOT / "frontend" / "node_modules" / "next" / "dist" / "docs",
        format="markdown",
        file_extensions=(".md",),
    ),

    # ------------------------------------------------------------ TypeScript
    "typescript": Corpus(
        name="typescript",
        description="TypeScript (handbook officiel)",
        local_path=DOCS_ROOT / "typescript",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/microsoft/TypeScript-Website.git",
        source_branch="v2",
        source_subpath="packages/documentation/copy/en",
    ),

    # ---------------------------------------------------------------- Tailwind
    "tailwind": Corpus(
        name="tailwind",
        description="Tailwind CSS",
        local_path=DOCS_ROOT / "tailwind",
        format="mdx",  # parsé comme markdown, on tolère les balises JSX
        file_extensions=(".mdx", ".md"),
        source_repo="https://github.com/tailwindlabs/tailwindcss.com.git",
        source_branch="main",
        source_subpath="src",
    ),

    # ---------------------------------------------------- Code du projet courant
    # Permet au tuteur de répondre à des questions sur le code que TU as écrit
    # (« regarde mon backend/rag.py », « est-ce que mon ChatMessage.tsx est
    # propre ? »). On scanne tout le repo en ignorant les dossiers énormes.
    "self": Corpus(
        name="self",
        description="Code de ce projet (python_expert)",
        local_path=PROJECT_ROOT,
        format="code",
        file_extensions=(".py", ".ts", ".tsx", ".js", ".jsx"),
        exclude_patterns=(
            "node_modules",
            ".next",
            ".cache",
            ".git",
            "__pycache__",
            "chroma_db",
            "docs-sources",
            "python-3.14-docs-text",
            ".venv",
            "venv",
        ),
    ),
}


def get_active_corpora() -> list[Corpus]:
    """Retourne les corpus dont le dossier local existe et n'est pas vide."""
    active = []
    for corpus in CORPORA.values():
        if corpus.local_path.exists() and any(corpus.local_path.rglob("*")):
            active.append(corpus)
    return active
