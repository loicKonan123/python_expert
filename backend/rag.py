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
    corpus: str   # nom du corpus d'origine ("python", "fastapi", ...)

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "source": self.source,
            "section": self.section,
            "score": self.score,
            "corpus": self.corpus,
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

    def retrieve(
        self,
        query: str,
        k: int | None = None,
        corpora: list[str] | None = None,
        expand_neighbors: bool = True,
    ) -> list[RetrievedChunk]:
        """Récupère les k chunks les plus pertinents pour la question.

        Si ``corpora`` est fourni et non vide, la recherche est restreinte
        à ces corpus (via le filtre ``where`` de ChromaDB).

        Si ``expand_neighbors`` : le reste du fichier du top hit est injecté
        derrière lui (pattern « small-to-big »). Une page de doc est cohérente
        — l'exemple de code qui illustre une intro vit souvent plus loin dans
        la même page, et les chunks de code pur s'embeddent mal face à une
        question en langage naturel (ex : l'exemple TrainingArguments de
        training.md score 0.32 quand son intro score 0.71). Si le fichier est
        trop gros pour entrer entier, on n'injecte que ses 2 meilleurs chunks.
        """
        k = k or settings.top_k

        t0 = time.perf_counter()
        embedding = self.embed_model.encode(
            [query],
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).tolist()
        embed_ms = (time.perf_counter() - t0) * 1000

        # Filtre par corpus si demandé. ChromaDB attend {"$in": [...]} pour les
        # disjonctions, ou directement {"corpus": "..."} pour un seul.
        where: dict | None = None
        if corpora:
            if len(corpora) == 1:
                where = {"corpus": corpora[0]}
            else:
                where = {"corpus": {"$in": list(corpora)}}

        t1 = time.perf_counter()
        results = self.collection.query(
            query_embeddings=embedding,
            n_results=k,
            where=where,
        )
        query_ms = (time.perf_counter() - t1) * 1000

        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        chunks = [
            RetrievedChunk(
                text=doc,
                source=meta.get("source", "?"),
                section=meta.get("section") or "(préambule)",
                score=round(1 - dist, 3),
                corpus=meta.get("corpus", "?"),
            )
            for doc, meta, dist in zip(docs, metas, distances)
        ]

        if expand_neighbors and chunks:
            neighbors = self._file_neighbors(embedding, chunks[0], exclude_ids=set(ids))
            chunks[1:1] = neighbors
            if neighbors:
                logger.info(
                    "  +%d chunk(s) voisin(s) de %s injecté(s)",
                    len(neighbors), chunks[0].source,
                )

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

    # Taille max (chars) d'un fichier pour l'injecter en entier derrière son
    # top hit. Au-delà, on retombe sur les 2 meilleurs chunks du fichier.
    # 12k chars ≈ 3k tokens — négligeable pour le budget de contexte.
    FILE_EXPANSION_BUDGET = 12_000

    def _file_neighbors(
        self,
        embedding: list,
        top: RetrievedChunk,
        exclude_ids: set[str],
        max_extra: int = 2,
    ) -> list[RetrievedChunk]:
        """Chunks du fichier du top hit à injecter derrière lui.

        Fichier petit (≤ FILE_EXPANSION_BUDGET chars) : TOUT le fichier, dans
        l'ordre du document — le LLM lit la page officielle complète.
        Fichier gros : seulement ses ``max_extra`` chunks les plus pertinents.

        Score affiché = celui du parent moins epsilon : ils restent collés à
        lui dans le ranking (y compris après le re-tri du boost par intent),
        sans jamais le dépasser.
        """
        try:
            got = self.collection.get(
                where={"$and": [{"corpus": top.corpus}, {"source": top.source}]},
            )
            rows = [
                (meta.get("start", 0), id_, doc, meta)
                for id_, doc, meta in zip(got["ids"], got["documents"], got["metadatas"])
            ]

            if sum(len(doc) for _, _, doc, _ in rows) > self.FILE_EXPANSION_BUDGET:
                # Fichier trop gros — on ne garde que ses meilleurs chunks.
                results = self.collection.query(
                    query_embeddings=embedding,
                    n_results=max_extra + len(exclude_ids),
                    where={"$and": [{"corpus": top.corpus}, {"source": top.source}]},
                )
                rows = [
                    (meta.get("start", 0), id_, doc, meta)
                    for id_, doc, meta in zip(
                        results["ids"][0], results["documents"][0], results["metadatas"][0]
                    )
                    if id_ not in exclude_ids
                ][:max_extra]
        except Exception as exc:  # défensif : l'expansion ne doit jamais casser le retrieval
            logger.warning("Expansion voisins impossible pour %s : %s", top.source, exc)
            return []

        return [
            RetrievedChunk(
                text=doc,
                source=meta.get("source", "?"),
                section=meta.get("section") or "(préambule)",
                score=round(max(top.score - 0.001, 0.0), 3),
                corpus=meta.get("corpus", "?"),
            )
            for _start, id_, doc, meta in sorted(rows, key=lambda r: r[0])
            if id_ not in exclude_ids
        ]


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
