"""Endpoint /api/health — état du backend (Ollama, collection, modèle)."""
from __future__ import annotations

import logging
import time
import urllib.error
import urllib.request
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

from ..config import settings


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["health"])


class HealthStatus(BaseModel):
    status: Literal["ok", "degraded", "down"]
    chunks_indexed: int
    embedding_model: str
    embedding_dim: int
    ollama_model: str
    ollama_reachable: bool
    uptime_s: float


@router.get("/health", response_model=HealthStatus)
def health(request: Request) -> HealthStatus:
    """Renvoie un statut détaillé du backend.

    Pratique pour vérifier depuis le frontend si tout est opérationnel,
    et pour debug rapide (qui répond ? combien de chunks ?).
    """
    state = request.app.state
    rag = state.rag
    ollama_ok = _ping_ollama()

    status: Literal["ok", "degraded", "down"]
    if ollama_ok and rag.collection.count() > 0:
        status = "ok"
    elif rag.collection.count() > 0:
        status = "degraded"  # collection ok mais ollama down
    else:
        status = "down"

    payload = HealthStatus(
        status=status,
        chunks_indexed=rag.collection.count(),
        embedding_model=settings.embedding_model,
        embedding_dim=rag.embed_model.get_sentence_embedding_dimension(),
        ollama_model=settings.ollama_model,
        ollama_reachable=ollama_ok,
        uptime_s=round(time.time() - state.started_at, 1),
    )
    logger.info(
        "Health: status=%s chunks=%d ollama=%s uptime=%.1fs",
        status, payload.chunks_indexed,
        "ok" if ollama_ok else "DOWN",
        payload.uptime_s,
    )
    return payload


def _ping_ollama() -> bool:
    """Tente un GET sur la racine d'Ollama avec un court timeout."""
    base = settings.ollama_url.rsplit("/api/", 1)[0]
    try:
        urllib.request.urlopen(base, timeout=2).read()
        return True
    except (urllib.error.URLError, TimeoutError):
        return False
