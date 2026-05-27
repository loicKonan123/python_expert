"""Segmentation des fichiers de documentation Python en chunks RAG.

Stratégie en deux niveaux :
  1. Découpage prioritaire sur les frontières sémantiques naturelles
     (titres soulignés par ===, ---, ***, séparateurs ==========).
  2. Découpage par paquets de paragraphes si une section dépasse encore
     CHUNK_SIZE. Un chevauchement (CHUNK_OVERLAP) préserve le contexte.

Chaque chunk est enrichi de métadonnées dérivées du chemin du fichier :
catégorie (library, tutorial, reference...), module ou sujet, et le titre
de section quand on peut l'extraire.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

from .config import settings


logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    text: str
    metadata: dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        return f"{self.metadata['source']}::{self.metadata['start']}"


# Titres Sphinx en texte brut : ligne de contenu suivie d'une ligne de
# soulignement composée d'un seul caractère répété.
_SECTION_HEADER = re.compile(
    r"^(?P<title>\S[^\n]{0,200})\n(?P<underline>[*=\-^\"]{3,})\s*$",
    re.MULTILINE,
)


def _extract_path_metadata(path: Path) -> dict:
    """Dérive catégorie + module à partir du chemin du fichier."""
    rel = path.relative_to(settings.docs_dir)
    parts = rel.parts
    category = parts[0] if len(parts) > 1 else "root"
    module = path.stem
    return {
        "source": str(rel).replace("\\", "/"),
        "category": category,
        "module": module,
    }


def _split_on_sections(text: str) -> list[tuple[str, str]]:
    """Découpe sur les titres Sphinx. Renvoie [(titre, contenu), ...].

    Le contenu inclut le titre et son soulignement pour rester lisible.
    """
    matches = list(_SECTION_HEADER.finditer(text))
    if not matches:
        return [("", text)]

    sections: list[tuple[str, str]] = []
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
    """Découpe un bloc trop long en morceaux ~CHUNK_SIZE avec chevauchement."""
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


def chunk_file(path: Path) -> list[Chunk]:
    """Lit un fichier .txt et renvoie la liste de ses chunks."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        logger.warning("Encodage non-UTF8 dans %s, fallback errors='replace'", path)
        text = path.read_text(encoding="utf-8", errors="replace")

    base_meta = _extract_path_metadata(path)
    sections = _split_on_sections(text)

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


def iter_all_files(root: Path | None = None) -> Iterator[Path]:
    """Itère sur tous les fichiers .txt de la documentation, triés."""
    yield from sorted((root or settings.docs_dir).rglob("*.txt"))


def chunk_all() -> Iterator[Chunk]:
    """Génère tous les chunks de toute la doc."""
    for path in iter_all_files():
        yield from chunk_file(path)
