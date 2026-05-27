"""Construit l'index vectoriel ChromaDB à partir des chunks de la doc Python.

Pipeline :
  1. Génération des chunks via backend.chunker.chunk_all().
  2. Encodage par lots avec sentence-transformers (local, CPU).
  3. Insertion dans ChromaDB persistant (`chroma_db/`).

Idempotent : si la collection existe déjà, on la supprime et on la
recrée à zéro. C'est plus simple et plus sûr qu'un upsert partiel pour
un premier dataset stable comme la doc Python.

Usage :
    python -m backend.scripts.build_index
    python -m backend.scripts.build_index --limit 50      # test rapide
    python -m backend.scripts.build_index --batch-size 64
"""
from __future__ import annotations

import argparse
import logging
import time
from typing import Iterable

import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

from ..chunker import Chunk, chunk_file, iter_all_files
from ..config import settings
from ..logging_config import setup_logging


logger = logging.getLogger(__name__)


def _batched(items: list, size: int) -> Iterable[list]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def collect_chunks(limit: int | None = None) -> list[Chunk]:
    """Parcourt la doc et retourne tous les chunks en mémoire."""
    files = list(iter_all_files())
    if limit is not None:
        files = files[:limit]
        logger.info("Mode limité : %d fichiers seulement", limit)

    chunks: list[Chunk] = []
    for path in tqdm(files, desc="Chunking", unit="fichier"):
        chunks.extend(chunk_file(path))
    return chunks


def build_index(batch_size: int = 64, limit: int | None = None) -> None:
    setup_logging(settings.log_level)
    start = time.perf_counter()

    logger.info("Source : %s", settings.docs_dir)
    chunks = collect_chunks(limit=limit)
    files_count = len({c.metadata["source"] for c in chunks})
    logger.info("%d chunks générés depuis %d fichiers", len(chunks), files_count)

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
        "--limit", type=int, default=None,
        help="N'indexer que les N premiers fichiers (test rapide).",
    )
    args = parser.parse_args()
    build_index(batch_size=args.batch_size, limit=args.limit)


if __name__ == "__main__":
    main()
