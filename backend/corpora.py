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

    # ============================================================
    # Phase 7 — Écosystème (libs tierces fréquemment associées au stack)
    # ============================================================

    # ---------------------------------------------------------------- pytest
    "pytest": Corpus(
        name="pytest",
        description="Pytest (testing Python)",
        local_path=DOCS_ROOT / "pytest",
        format="rst",
        file_extensions=(".rst",),
        source_repo="https://github.com/pytest-dev/pytest.git",
        source_branch="main",
        source_subpath="doc/en",
    ),

    # ---------------------------------------------------------------- httpx
    "httpx": Corpus(
        name="httpx",
        description="HTTPX (client HTTP Python moderne)",
        local_path=DOCS_ROOT / "httpx",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/encode/httpx.git",
        source_branch="master",
        source_subpath="docs",
    ),

    # ------------------------------------------------------------ sqlalchemy
    "sqlalchemy": Corpus(
        name="sqlalchemy",
        description="SQLAlchemy 2.x (ORM Python)",
        local_path=DOCS_ROOT / "sqlalchemy",
        format="rst",
        file_extensions=(".rst",),
        source_repo="https://github.com/sqlalchemy/sqlalchemy.git",
        source_branch="main",
        source_subpath="doc/build",
    ),

    # ---------------------------------------------------------------- Zod
    "zod": Corpus(
        name="zod",
        description="Zod (validation TS)",
        local_path=DOCS_ROOT / "zod",
        format="mdx",  # docs Zod en MDX dans packages/docs
        file_extensions=(".mdx", ".md"),
        source_repo="https://github.com/colinhacks/zod.git",
        source_branch="main",
        source_subpath="packages/docs",
    ),

    # ---------------------------------------------------------------- TanStack Query
    "tanstack_query": Corpus(
        name="tanstack_query",
        description="TanStack Query (data fetching React)",
        local_path=DOCS_ROOT / "tanstack-query",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/TanStack/query.git",
        source_branch="main",
        source_subpath="docs/framework/react",
    ),

    # ---------------------------------------------------------------- Vitest
    "vitest": Corpus(
        name="vitest",
        description="Vitest (testing TS/JS)",
        local_path=DOCS_ROOT / "vitest",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/vitest-dev/vitest.git",
        source_branch="main",
        source_subpath="docs",
    ),

    # --------------------------------------------------------------- MDN HTML
    # Source : repo officiel Mozilla Developer Network. Markdown, structuré,
    # tenu à jour par Mozilla + communauté web. Référence absolue pour HTML.
    "html": Corpus(
        name="html",
        description="HTML (référence MDN)",
        local_path=DOCS_ROOT / "html",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/mdn/content.git",
        source_branch="main",
        source_subpath="files/en-us/web/html",
    ),

    # --------------------------------------------------------------- MDN CSS
    "css": Corpus(
        name="css",
        description="CSS (référence MDN)",
        local_path=DOCS_ROOT / "css",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/mdn/content.git",
        source_branch="main",
        source_subpath="files/en-us/web/css",
    ),

    # -------------------------------------------------------- MDN JavaScript
    "javascript": Corpus(
        name="javascript",
        description="JavaScript / ECMAScript (référence MDN)",
        local_path=DOCS_ROOT / "javascript",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/mdn/content.git",
        source_branch="main",
        source_subpath="files/en-us/web/javascript",
    ),

    # ─────────────────────────────────────────────────────────── Écosystème .NET
    # Trois corpus officiels Microsoft, miroir du pattern Python (langage +
    # framework web + ORM). Couvre l'essentiel du backend dotnet moderne.
    "csharp": Corpus(
        name="csharp",
        description="C# (référence officielle Microsoft)",
        local_path=DOCS_ROOT / "csharp",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/dotnet/docs.git",
        source_branch="main",
        source_subpath="docs/csharp",
    ),

    # ASP.NET Core — équivalent de FastAPI / Django dans le monde .NET
    "aspnet": Corpus(
        name="aspnet",
        description="ASP.NET Core (web framework .NET officiel)",
        local_path=DOCS_ROOT / "aspnet",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/dotnet/AspNetCore.Docs.git",
        source_branch="main",
        source_subpath="aspnetcore",
    ),

    # Entity Framework Core — équivalent de SQLAlchemy dans le monde .NET
    "efcore": Corpus(
        name="efcore",
        description="Entity Framework Core (ORM .NET officiel)",
        local_path=DOCS_ROOT / "efcore",
        format="markdown",
        file_extensions=(".md",),
        source_repo="https://github.com/dotnet/EntityFramework.Docs.git",
        source_branch="main",
        source_subpath="entity-framework/core",
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
