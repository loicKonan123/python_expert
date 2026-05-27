"""Construit l'index vectoriel ChromaDB à partir des chunks de la doc Python.

Pipeline :
  1. Génération des chunks via chunker.chunk_all().
  2. Encodage par lots avec sentence-transformers (local, CPU).
  3. Insertion dans ChromaDB persistant (dossier chroma_db/).

Idempotent : si la collection existe déjà, on la supprime et on la
recrée à zéro. C'est plus simple et plus sûr qu'un upsert partiel pour
un premier dataset stable comme la doc Python.

Usage :
    python build_index.py
    python build_index.py --limit 50      # test rapide sur 50 fichiers
    python build_index.py --batch-size 64 # ajuster selon la RAM
"""
from __future__ import annotations

import argparse
import time
from typing import Iterable

import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

from chunker import Chunk, chunk_file, iter_all_files
from config import CHROMA_DIR, COLLECTION_NAME, EMBEDDING_MODEL


def _batched(items: list, size: int) -> Iterable[list]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def collect_chunks(limit: int | None = None) -> list[Chunk]:
    """Parcourt la doc et retourne tous les chunks en mémoire.

    15 MB de texte donnent ~quelques milliers de chunks de quelques KB :
    largement tenable en RAM, et avoir la liste complète simplifie le
    suivi de progression et l'encodage par lots.
    """
    chunks: list[Chunk] = []
    files = list(iter_all_files())
    if limit is not None:
        files = files[:limit]

    for path in tqdm(files, desc="Chunking", unit="fichier"):
        chunks.extend(chunk_file(path))
    return chunks


def build_index(batch_size: int = 64, limit: int | None = None) -> None:
    start = time.perf_counter()

    chunks = collect_chunks(limit=limit)
    print(f"\n{len(chunks):,} chunks générés depuis "
          f"{len({c.metadata['source'] for c in chunks}):,} fichiers.")

    print(f"\nChargement du modèle d'embedding : {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    # On reset la collection à chaque build pour rester déterministe.
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"Ancienne collection '{COLLECTION_NAME}' supprimée.")
    except (ValueError, chromadb.errors.NotFoundError):
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        # Les embeddings sont fournis par nous-mêmes, donc on désactive
        # toute fonction d'embedding par défaut côté Chroma.
        embedding_function=None,
        metadata={"hnsw:space": "cosine"},
    )

    print(f"\nEncodage + insertion par lots de {batch_size}...")
    for batch in tqdm(list(_batched(chunks, batch_size)),
                      desc="Embedding", unit="batch"):
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
    print(
        f"\nTerminé en {elapsed:.1f}s. "
        f"Collection '{COLLECTION_NAME}' contient {collection.count():,} chunks.\n"
        f"Index persisté dans : {CHROMA_DIR}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--limit", type=int, default=None,
                        help="N'indexer que les N premiers fichiers (test).")
    args = parser.parse_args()
    build_index(batch_size=args.batch_size, limit=args.limit)


if __name__ == "__main__":
    main()
