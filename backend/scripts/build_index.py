"""Construit l'index vectoriel ChromaDB à partir de TOUS les corpus actifs.

Pipeline :
  1. Itère sur les corpus dont le local_path existe (cf backend/corpora.py).
  2. Chunke chaque fichier selon le format du corpus.
  3. Encode par lots avec sentence-transformers (local, CPU).
  4. Insère dans ChromaDB persistant (`chroma_db/`).

Idempotent : recrée la collection à zéro à chaque exécution.

Usage :
    python -m backend.scripts.build_index
    python -m backend.scripts.build_index --batch-size 64
    python -m backend.scripts.build_index --corpus fastapi   # un seul corpus
"""
from __future__ import annotations

import argparse
import logging
import time
from collections import Counter
from typing import Iterable

import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

from ..chunker import Chunk, chunk_corpus, iter_corpus_files
from ..config import settings
from ..corpora import get_active_corpora
from ..logging_config import setup_logging


logger = logging.getLogger(__name__)


def _batched(items: list, size: int) -> Iterable[list]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def collect_chunks(corpora_names: list[str] | None = None) -> list[Chunk]:
    """Collecte tous les chunks des corpus actifs (ou ceux filtrés)."""
    corpora = get_active_corpora()
    if corpora_names:
        corpora = [c for c in corpora if c.name in corpora_names]

    if not corpora:
        logger.error(
            "Aucun corpus actif. Lance d'abord : python -m backend.scripts.fetch_docs"
        )
        return []

    all_chunks: list[Chunk] = []
    for corpus in corpora:
        file_count = sum(1 for _ in iter_corpus_files(corpus))
        logger.info(
            "Corpus '%s' (%s) : %d fichiers depuis %s",
            corpus.name, corpus.format, file_count, corpus.local_path,
        )
        before = len(all_chunks)
        for chunk in tqdm(
            chunk_corpus(corpus),
            desc=f"Chunking {corpus.name}",
            unit="chunk",
        ):
            all_chunks.append(chunk)
        added = len(all_chunks) - before
        logger.info("  → %d chunks générés (moyenne %.0f chars)",
                    added,
                    sum(len(c.text) for c in all_chunks[before:]) / max(added, 1))

    return all_chunks


def build_index(
    batch_size: int = 64,
    corpora_names: list[str] | None = None,
) -> None:
    setup_logging(settings.log_level)
    start = time.perf_counter()

    chunks = collect_chunks(corpora_names)
    if not chunks:
        return

    # Statistiques par corpus
    counter = Counter(c.metadata["corpus"] for c in chunks)
    logger.info("Total : %d chunks", len(chunks))
    for name, count in counter.most_common():
        logger.info("  %s : %d chunks", name, count)

    logger.info("Chargement du modèle d'embedding : %s", settings.embedding_model)
    model = SentenceTransformer(settings.embedding_model)

    logger.info("Connexion à ChromaDB : %s", settings.chroma_dir)
    client = chromadb.PersistentClient(path=str(settings.chroma_dir))
    try:
        client.delete_collection(settings.collection_name)
        logger.info("Ancienne collection '%s' supprimée.", settings.collection_name)
    except (ValueError, chromadb.errors.NotFoundError):
        pass

    collection = client.create_collection(
        name=settings.collection_name,
        embedding_function=None,
        metadata={"hnsw:space": "cosine"},
    )

    logger.info("Encodage + insertion par lots de %d...", batch_size)
    for batch in tqdm(
        list(_batched(chunks, batch_size)),
        desc="Embedding",
        unit="batch",
    ):
        texts = [c.text for c in batch]
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).tolist()
        collection.add(
            ids=[c.id for c in batch],
            documents=texts,
            embeddings=embeddings,
            metadatas=[c.metadata for c in batch],
        )

    elapsed = time.perf_counter() - start
    logger.info(
        "Terminé en %.1fs. Collection '%s' : %d chunks.",
        elapsed, settings.collection_name, collection.count(),
    )
    logger.info("Index persisté dans : %s", settings.chroma_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument(
        "--corpus",
        action="append",
        help="Limiter à ce(s) corpus (option répétable). "
             "Par défaut : tous les corpus actifs.",
    )
    args = parser.parse_args()
    build_index(batch_size=args.batch_size, corpora_names=args.corpus)


if __name__ == "__main__":
    main()
