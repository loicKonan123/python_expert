"""Segmentation des fichiers de documentation Python en chunks RAG.

Stratégie en deux niveaux :
  1. Découpage prioritaire sur les frontières sémantiques naturelles
     (titres soulignés par ===, ---, séparateurs ==========).
  2. Découpage par paquets de paragraphes si une section dépasse encore
     CHUNK_SIZE. Un chevauchement (CHUNK_OVERLAP) préserve le contexte.

Chaque chunk est enrichi de métadonnées dérivées du chemin du fichier :
catégorie (library, tutorial, reference...), module ou sujet, et le titre
de section quand on peut l'extraire.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator

from config import CHUNK_OVERLAP, CHUNK_SIZE, DOCS_DIR, MIN_CHUNK_SIZE


@dataclass
class Chunk:
    text: str
    metadata: dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        # Identifiant stable : source + position de départ.
        return f"{self.metadata['source']}::{self.metadata['start']}"


# Titres Sphinx en texte brut : une ligne de contenu suivie d'une ligne de
# soulignement composée d'un seul caractère répété. Niveaux courants : *, =, -, ^, ".
_SECTION_HEADER = re.compile(
    r"^(?P<title>\S[^\n]{0,200})\n(?P<underline>[*=\-^\"]{3,})\s*$",
    re.MULTILINE,
)


def _extract_path_metadata(path: Path) -> dict:
    """Dérive catégorie + module à partir du chemin du fichier."""
    rel = path.relative_to(DOCS_DIR)
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
    # Texte avant le premier titre (préambule).
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
    """Découpe un bloc trop long en morceaux ~CHUNK_SIZE avec chevauchement.

    On essaie d'abord les coupes sur double saut de ligne (paragraphes),
    puis sur saut simple si rien d'autre ne va.
    """
    if len(text) <= CHUNK_SIZE:
        yield text
        return

    paragraphs = re.split(r"\n\s*\n", text)
    buffer = ""
    for para in paragraphs:
        candidate = f"{buffer}\n\n{para}" if buffer else para
        if len(candidate) <= CHUNK_SIZE:
            buffer = candidate
            continue

        if buffer:
            yield buffer
            # On reprend les derniers caractères du buffer pour le chevauchement.
            overlap = buffer[-CHUNK_OVERLAP:] if CHUNK_OVERLAP else ""
            buffer = f"{overlap}\n\n{para}" if overlap else para
        else:
            # Le paragraphe seul dépasse déjà : on coupe brutalement.
            for i in range(0, len(para), CHUNK_SIZE - CHUNK_OVERLAP):
                yield para[i : i + CHUNK_SIZE]
            buffer = ""

    if buffer:
        yield buffer


def chunk_file(path: Path) -> list[Chunk]:
    """Lit un fichier .txt et renvoie la liste de ses chunks."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="replace")

    base_meta = _extract_path_metadata(path)
    sections = _split_on_sections(text)

    chunks: list[Chunk] = []
    cursor = 0
    for section_title, section_text in sections:
        for piece in _split_long_text(section_text):
            piece = piece.strip()
            if len(piece) < MIN_CHUNK_SIZE:
                # On préfère fusionner ces miettes avec le chunk précédent
                # plutôt que de produire un chunk inutile.
                if chunks:
                    chunks[-1].text += "\n\n" + piece
                continue

            meta = {
                **base_meta,
                "section": section_title,
                "start": cursor,
            }
            chunks.append(Chunk(text=piece, metadata=meta))
            cursor += len(piece)

    return chunks


def iter_all_files(root: Path = DOCS_DIR) -> Iterator[Path]:
    """Itère sur tous les fichiers .txt de la documentation, triés."""
    yield from sorted(root.rglob("*.txt"))


def chunk_all() -> Iterator[Chunk]:
    """Génère tous les chunks de toute la doc."""
    for path in iter_all_files():
        yield from chunk_file(path)


if __name__ == "__main__":
    # Mode démonstration : on chunke un seul fichier et on affiche un aperçu.
    sample = DOCS_DIR / "library" / "dataclasses.txt"
    if sample.exists():
        chunks = chunk_file(sample)
        print(f"{sample.name} -> {len(chunks)} chunks")
        for i, c in enumerate(chunks[:3]):
            print(f"\n--- Chunk {i} (section: {c.metadata['section']!r}) ---")
            print(c.text[:300] + ("..." if len(c.text) > 300 else ""))
