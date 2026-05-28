"""Moteur de récupération RAG : encode la question, interroge ChromaDB.

Le modèle d'embedding et la connexion ChromaDB sont chargés une seule fois
à l'initialisation. L'instance unique vit dans le state FastAPI (cf main.py).
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import chromadb
from sentence_transformers import SentenceTransformer

from .config import settings


logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """Un chunk retourné au client. Sérialisable en JSON."""
    text: str
    source: str
    section: str
    score: float  # similarité cosinus (1 - distance), arrondie à 3 décimales

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "source": self.source,
            "section": self.section,
            "score": self.score,
        }


class RAGEngine:
    """Moteur de récupération singleton — charge le modèle et la collection."""

    def __init__(self) -> None:
        logger.info("Chargement du modèle d'embedding : %s", settings.embedding_model)
        t0 = time.perf_counter()
        self.embed_model = SentenceTransformer(settings.embedding_model)
        logger.info(
            "Modèle d'embedding chargé en %.2fs (dim=%d)",
            time.perf_counter() - t0,
            _embed_dim(self.embed_model),
        )

        logger.info("Connexion à ChromaDB : %s", settings.chroma_dir)
        self.client = chromadb.PersistentClient(path=str(settings.chroma_dir))
        try:
            self.collection = self.client.get_collection(settings.collection_name)
        except (ValueError, chromadb.errors.NotFoundError) as exc:
            raise RuntimeError(
                f"Collection '{settings.collection_name}' introuvable. "
                f"Lance d'abord : python -m backend.scripts.build_index"
            ) from exc

        count = self.collection.count()
        logger.info(
            "Collection '%s' prête : %d chunks indexés",
            settings.collection_name,
            count,
        )
        if count == 0:
            logger.warning("Collection vide — relance build_index pour ré-indexer.")

    def retrieve(self, query: str, k: int | None = None) -> list[RetrievedChunk]:
        """Récupère les k chunks les plus pertinents pour la question."""
        k = k or settings.top_k

        t0 = time.perf_counter()
        embedding = self.embed_model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).tolist()
        embed_ms = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        results = self.collection.query(query_embeddings=embedding, n_results=k)
        query_ms = (time.perf_counter() - t1) * 1000

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        chunks = [
            RetrievedChunk(
                text=doc,
                source=meta.get("source", "?"),
                section=meta.get("section") or "(préambule)",
                score=round(1 - dist, 3),
            )
            for doc, meta, dist in zip(docs, metas, distances)
        ]

        top_score = chunks[0].score if chunks else 0.0
        logger.info(
            "Retrieval k=%d top_score=%.3f embed=%dms query=%dms — \"%s\"",
            k,
            top_score,
            int(embed_ms),
            int(query_ms),
            _truncate(query, 60),
        )
        for i, c in enumerate(chunks, 1):
            logger.debug("  #%d score=%.3f %s §%s", i, c.score, c.source, c.section)

        return chunks


def _truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"


def _embed_dim(model: SentenceTransformer) -> int:
    """Récupère la dimension d'embedding, en supportant l'ancien et le nouveau nom.

    sentence-transformers a renommé ``get_sentence_embedding_dimension`` en
    ``get_embedding_dimension`` (FutureWarning sinon).
    """
    for attr in ("get_embedding_dimension", "get_sentence_embedding_dimension"):
        fn = getattr(model, attr, None)
        if callable(fn):
            return int(fn())
    return -1
