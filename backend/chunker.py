"""Segmentation des fichiers de documentation en chunks RAG.

Supporte plusieurs formats :
  - sphinx-text : titres soulignés par ===/---/*** (doc Python officielle)
  - markdown : titres `# / ## / ###` (FastAPI, Pydantic, Next.js, TypeScript)
  - rst : reStructuredText (Pytest, Django, SQLAlchemy)
  - mdx : Markdown + JSX (Tailwind) — traité comme markdown, balises JSX ignorées

Chaque chunk reçoit des métadonnées :
  - corpus : identifiant ("python", "fastapi"...)
  - source : chemin relatif depuis local_path du corpus
  - category : premier segment du chemin (ex: "library" pour Python)
  - module : nom du fichier sans extension
  - section : titre Sphinx/markdown détecté (peut être vide)
  - start : offset entier (utilisé pour l'id stable du chunk)
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

from .config import settings
from .corpora import Corpus


logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    text: str
    metadata: dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        # ID stable : corpus + chemin + offset → unique entre corpus.
        return f"{self.metadata['corpus']}::{self.metadata['source']}::{self.metadata['start']}"


# ----------------------------------------------------------------------------
# Regex de détection des titres selon le format
# ----------------------------------------------------------------------------

# Sphinx text : "Titre\n=====" (la ligne du dessous est composée d'un seul char)
_SPHINX_HEADER = re.compile(
    r"^(?P<title>\S[^\n]{0,200})\n(?P<underline>[*=\-^\"]{3,})\s*$",
    re.MULTILINE,
)

# Markdown : "# Titre", "## Titre", "### Titre" (jusqu'à 6 #)
_MARKDOWN_HEADER = re.compile(
    r"^(?P<hashes>#{1,6})\s+(?P<title>.+?)\s*$",
    re.MULTILINE,
)

# RST : identique à Sphinx text (RST → Sphinx text est juste une question de rendu)
_RST_HEADER = _SPHINX_HEADER


def _split_on_sections(text: str, fmt: str) -> list[tuple[str, str]]:
    """Découpe le texte en sections. Retourne [(titre, contenu), ...].

    Le contenu inclut le titre lui-même (pour rester lisible dans le chunk).
    """
    if fmt == "markdown" or fmt == "mdx":
        pattern = _MARKDOWN_HEADER
    elif fmt == "rst":
        pattern = _RST_HEADER
    else:
        pattern = _SPHINX_HEADER

    matches = list(pattern.finditer(text))
    if not matches:
        return [("", text)]

    sections: list[tuple[str, str]] = []
    # Préambule (avant le premier titre)
    if matches[0].start() > 0:
        preamble = text[: matches[0].start()].strip()
        if preamble:
            sections.append(("", preamble))

    for i, m in enumerate(matches):
        title = m.group("title").strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections.append((title, text[start:end].strip()))

    return sections


def _split_long_text(text: str) -> Iterator[str]:
    """Découpe un bloc trop long en morceaux ~chunk_size avec chevauchement."""
    if len(text) <= settings.chunk_size:
        yield text
        return

    paragraphs = re.split(r"\n\s*\n", text)
    buffer = ""
    for para in paragraphs:
        candidate = f"{buffer}\n\n{para}" if buffer else para
        if len(candidate) <= settings.chunk_size:
            buffer = candidate
            continue

        if buffer:
            yield buffer
            overlap = buffer[-settings.chunk_overlap:] if settings.chunk_overlap else ""
            buffer = f"{overlap}\n\n{para}" if overlap else para
        else:
            for i in range(0, len(para), settings.chunk_size - settings.chunk_overlap):
                yield para[i : i + settings.chunk_size]
            buffer = ""

    if buffer:
        yield buffer


def _extract_path_metadata(path: Path, corpus: Corpus) -> dict:
    """Dérive corpus + catégorie + module à partir du chemin relatif."""
    try:
        rel = path.relative_to(corpus.local_path)
    except ValueError:
        # Le fichier n'est pas sous local_path — on stocke le chemin absolu en repli.
        rel = path
    parts = rel.parts
    category = parts[0] if len(parts) > 1 else "root"
    module = path.stem
    return {
        "corpus": corpus.name,
        "source": str(rel).replace("\\", "/"),
        "category": category,
        "module": module,
    }


def _strip_mdx_jsx(text: str) -> str:
    """Pour les fichiers MDX : retire grossièrement les balises JSX inline.

    On garde les blocs markdown classiques. Les composants JSX (<Card>, etc.)
    sont remplacés par des espaces pour ne pas polluer les embeddings.
    """
    # Composants auto-fermants <Foo />
    text = re.sub(r"<[A-Z][^>]*?/>", "", text)
    # Balises ouvrantes/fermantes <Foo>...</Foo> (non gourmand)
    text = re.sub(r"<[A-Z][^>]*?>", "", text)
    text = re.sub(r"</[A-Z][^>]*?>", "", text)
    return text


def chunk_file(path: Path, corpus: Corpus) -> list[Chunk]:
    """Lit un fichier et le découpe en chunks selon le format du corpus."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        logger.warning("Encodage non-UTF8 dans %s, fallback errors='replace'", path)
        text = path.read_text(encoding="utf-8", errors="replace")

    if corpus.format == "mdx":
        text = _strip_mdx_jsx(text)

    base_meta = _extract_path_metadata(path, corpus)
    sections = _split_on_sections(text, corpus.format)

    chunks: list[Chunk] = []
    cursor = 0
    for section_title, section_text in sections:
        for piece in _split_long_text(section_text):
            piece = piece.strip()
            if len(piece) < settings.min_chunk_size:
                if chunks:
                    chunks[-1].text += "\n\n" + piece
                continue

            meta = {**base_meta, "section": section_title, "start": cursor}
            chunks.append(Chunk(text=piece, metadata=meta))
            cursor += len(piece)

    return chunks


def iter_corpus_files(corpus: Corpus) -> Iterator[Path]:
    """Itère sur tous les fichiers du corpus correspondant à ses extensions."""
    if not corpus.local_path.exists():
        logger.warning("Corpus '%s' introuvable : %s", corpus.name, corpus.local_path)
        return
    for ext in corpus.file_extensions:
        yield from sorted(corpus.local_path.rglob(f"*{ext}"))


def chunk_corpus(corpus: Corpus) -> Iterator[Chunk]:
    """Génère tous les chunks d'un corpus."""
    for path in iter_corpus_files(corpus):
        yield from chunk_file(path, corpus)
