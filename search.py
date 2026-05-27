"""Test de la récupération RAG (étape 3 du flux, sans LLM).

Permet de vérifier que la base vectorielle renvoie bien les chunks
pertinents pour une question donnée. C'est exactement ce qu'on enverra
plus tard comme contexte au LLM via Ollama.

Usage :
    python search.py "comment fonctionne un décorateur ?"
    python search.py "list comprehension" --k 3
    python search.py "asyncio task" --category library --k 5
"""
from __future__ import annotations

import argparse
import textwrap

import chromadb
from sentence_transformers import SentenceTransformer

from config import CHROMA_DIR, COLLECTION_NAME, EMBEDDING_MODEL


def search(query: str, k: int = 5, category: str | None = None) -> None:
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except (ValueError, chromadb.errors.NotFoundError):
        raise SystemExit(
            f"Collection '{COLLECTION_NAME}' introuvable. "
            f"Lance d'abord :  python build_index.py"
        )

    model = SentenceTransformer(EMBEDDING_MODEL)
    embedding = model.encode(
        [query], normalize_embeddings=True, convert_to_numpy=True
    ).tolist()

    where = {"category": category} if category else None
    results = collection.query(
        query_embeddings=embedding,
        n_results=k,
        where=where,
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    print(f"\nQuestion : {query}\n")
    print(f"Top {len(docs)} chunks (cosine distance) :\n")
    for rank, (doc, meta, dist) in enumerate(zip(docs, metas, distances), 1):
        score = 1 - dist  # similarité cosinus pour lecture humaine
        section = meta.get("section") or "(préambule)"
        print(f"#{rank}  score={score:.3f}  {meta['source']}  §{section}")
        # Aperçu de 400 caractères, ré-indenté pour la lecture console.
        excerpt = textwrap.shorten(
            doc.replace("\n", " "), width=400, placeholder=" ..."
        )
        print(textwrap.indent(excerpt, "    "))
        print()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", help="La question à poser à l'index.")
    parser.add_argument("--k", type=int, default=5,
                        help="Nombre de chunks à récupérer (défaut : 5).")
    parser.add_argument("--category", default=None,
                        help="Filtrer par catégorie (library, tutorial, ...).")
    args = parser.parse_args()
    search(args.query, k=args.k, category=args.category)


if __name__ == "__main__":
    main()
