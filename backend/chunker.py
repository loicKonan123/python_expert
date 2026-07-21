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


# Bloc de métadonnées YAML en tête de fichier markdown : "---\n…\n---".
# Fréquent dans les docs Microsoft (title, ms.date, helpviewer_keywords, …).
# C'est de la métadonnée, pas du contenu pédagogique → on la retire.
_FRONTMATTER = re.compile(r"\A---\r?\n.*?\r?\n---[ \t]*\r?\n", re.DOTALL)


def _strip_frontmatter(text: str) -> str:
    """Retire un éventuel bloc frontmatter YAML en tête (non gourmand)."""
    return _FRONTMATTER.sub("", text, count=1)


def _paragraphs_preserving_code(text: str) -> list[str]:
    """Découpe en paragraphes sur les lignes vides, MAIS garde chaque bloc de
    code délimité par ``` d'un seul tenant.

    Sans ça, une ligne vide À L'INTÉRIEUR d'un exemple de code servait de point
    de coupe et scindait le bloc en deux chunks (code cassé, inexploitable).
    """
    blocks: list[str] = []
    buf: list[str] = []
    in_code = False
    for line in text.split("\n"):
        stripped = line.lstrip()
        if stripped.startswith("```"):
            in_code = not in_code
            buf.append(line)
            continue
        if not in_code and stripped == "":
            if buf:
                blocks.append("\n".join(buf))
                buf = []
        else:
            buf.append(line)
    if buf:
        blocks.append("\n".join(buf))
    return blocks


def _split_long_text(text: str) -> Iterator[str]:
    """Découpe un bloc trop long en morceaux ~chunk_size avec chevauchement.

    Les blocs de code ne sont jamais coupés en leur milieu : un exemple de code
    plus gros que chunk_size est conservé entier (mieux qu'un code tronqué).
    """
    if len(text) <= settings.chunk_size:
        yield text
        return

    blocks = _paragraphs_preserving_code(text)
    buffer = ""
    for block in blocks:
        candidate = f"{buffer}\n\n{block}" if buffer else block
        if len(candidate) <= settings.chunk_size:
            buffer = candidate
            continue

        if buffer:
            yield buffer
            overlap = buffer[-settings.chunk_overlap:] if settings.chunk_overlap else ""
            # Un overlap avec un nombre impair de ``` démarre au milieu d'un
            # bloc de code → on le supprime pour ne pas laisser de fence orpheline.
            if overlap.count("```") % 2 == 1:
                overlap = ""
            buffer = f"{overlap}\n\n{block}" if overlap else block
        elif block.lstrip().startswith("```"):
            # Bloc de code seul, plus gros que chunk_size : on le garde entier.
            yield block
            buffer = ""
        else:
            for i in range(0, len(block), settings.chunk_size - settings.chunk_overlap):
                yield block[i : i + settings.chunk_size]
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


def _detect_language(path: Path) -> str:
    """Mappe l'extension d'un fichier vers un nom de langage humain."""
    ext = path.suffix.lower()
    return {
        ".py": "python",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
    }.get(ext, "unknown")


def _chunk_code(text: str) -> list[tuple[str, str]]:
    """Découpe un fichier de code en sections logiques (fonctions, classes).

    Heuristique de détection des frontières (commune Python/TypeScript) :
      - Ligne qui commence par ``def `` / ``class `` / ``async def `` (Python)
      - Ligne qui commence par ``function ``, ``export function ``,
        ``class ``, ``export class ``, ``const X = ``, ``export const X = ``,
        ``interface ``, ``type ``, ``enum `` (TypeScript)

    Si pas de frontière détectée, retourne tout le fichier comme un seul bloc.
    Le découpage en chunks de taille max se fait ensuite via _split_long_text.

    Retourne [(label, code), ...] où label décrit la section
    (« function fooBar », « class Sidebar », ou "" pour préambule/global).
    """
    lines = text.split("\n")
    if not lines:
        return [("", text)]

    # Pattern qui détecte le DÉBUT d'une déclaration de top-level. On exige
    # indent=0 (pas d'espace en début de ligne) pour ignorer les méthodes
    # imbriquées qui restent dans le chunk de leur classe parente.
    boundary_re = re.compile(
        r"^("
        r"async\s+def\s+(\w+)"           # Python : async def foo
        r"|def\s+(\w+)"                  # Python : def foo
        r"|class\s+(\w+)"                # Python ou TS : class Foo
        r"|export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)"  # TS export function
        r"|export\s+(?:default\s+)?(?:async\s+)?class\s+(\w+)"     # TS export class
        r"|export\s+const\s+(\w+)"       # TS export const Foo =
        r"|function\s+(\w+)"             # TS function foo
        r"|interface\s+(\w+)"            # TS interface Foo
        r"|export\s+interface\s+(\w+)"   # TS export interface Foo
        r"|type\s+(\w+)\s*="             # TS type Foo =
        r"|export\s+type\s+(\w+)\s*="    # TS export type Foo =
        r"|enum\s+(\w+)"                 # TS enum Foo
        r"|export\s+enum\s+(\w+)"        # TS export enum Foo
        r")"
    )

    sections: list[tuple[str, list[str]]] = []
    current_label = ""
    current_lines: list[str] = []

    for line in lines:
        # Détecte une nouvelle frontière à indent zéro
        if line and not line[0].isspace():
            m = boundary_re.match(line)
            if m:
                # Flush la section précédente
                if current_lines:
                    sections.append((current_label, current_lines))
                # Prend le nom capturé (le premier groupe non vide après le groupe 1)
                name = next((g for g in m.groups()[1:] if g), "")
                current_label = m.group(1).split()[-1] if not name else name
                # On garde le mot-clé pour mieux décrire la section
                keyword = m.group(0).split()[0]
                current_label = f"{keyword} {name}".strip()
                current_lines = [line]
                continue
        current_lines.append(line)

    if current_lines:
        sections.append((current_label, current_lines))

    return [(label, "\n".join(lns)) for label, lns in sections if lns]


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

    # Un corpus peut mélanger les extensions (ex. PyTorch : .rst + .md MyST).
    # Le découpage en sections suit le format réel du fichier, pas celui du corpus.
    fmt = corpus.format
    if fmt == "rst" and path.suffix in (".md", ".mdx"):
        fmt = "mdx"
    elif fmt in ("markdown", "mdx") and path.suffix == ".rst":
        fmt = "rst"

    if fmt in ("markdown", "mdx"):
        text = _strip_frontmatter(text)
    if fmt == "mdx":
        text = _strip_mdx_jsx(text)

    base_meta = _extract_path_metadata(path, corpus)
    # Ajoute le langage à la métadonnée pour les fichiers de code
    if fmt == "code":
        base_meta["language"] = _detect_language(path)

    if fmt == "code":
        sections = _chunk_code(text)
    else:
        sections = _split_on_sections(text, fmt)

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
    """Itère sur tous les fichiers du corpus correspondant à ses extensions.

    Les chemins dont une partie correspond à un ``exclude_patterns`` sont
    ignorés (utile pour le corpus de code afin d'écarter node_modules, etc.).
    """
    if not corpus.local_path.exists():
        logger.warning("Corpus '%s' introuvable : %s", corpus.name, corpus.local_path)
        return

    excludes = set(corpus.exclude_patterns)

    def is_excluded(path: Path) -> bool:
        if not excludes:
            return False
        try:
            rel = path.relative_to(corpus.local_path)
        except ValueError:
            return False
        return any(part in excludes for part in rel.parts)

    seen: set[Path] = set()
    for ext in corpus.file_extensions:
        for p in sorted(corpus.local_path.rglob(f"*{ext}")):
            if p in seen or is_excluded(p):
                continue
            seen.add(p)
            yield p


def chunk_corpus(corpus: Corpus) -> Iterator[Chunk]:
    """Génère tous les chunks d'un corpus."""
    for path in iter_corpus_files(corpus):
        yield from chunk_file(path, corpus)
