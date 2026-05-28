"""Endpoint /api/health — état du backend (provider, modèles, collection)."""
from __future__ import annotations

import logging
import time
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

from ..config import settings
from ..rag import _embed_dim as _embed_dim_safe


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["health"])


class HealthStatus(BaseModel):
    status: Literal["ok", "degraded", "down"]
    chunks_indexed: int
    embedding_model: str
    embedding_dim: int
    llm_provider: str  # "ollama" ou "deepseek"
    llm_model: str
    uptime_s: float


@router.get("/health", response_model=HealthStatus)
def health(request: Request) -> HealthStatus:
    """Renvoie un statut détaillé du backend.

    Pratique pour vérifier depuis le frontend si tout est opérationnel,
    et pour debug rapide (quel provider, quel modèle, combien de chunks ?).
    """
    state = request.app.state
    rag = state.rag
    llm = state.llm

    status: Literal["ok", "degraded", "down"]
    if rag.collection.count() > 0:
        status = "ok"
    else:
        status = "down"

    payload = HealthStatus(
        status=status,
        chunks_indexed=rag.collection.count(),
        embedding_model=settings.embedding_model,
        embedding_dim=_embed_dim_safe(rag.embed_model),
        llm_provider=llm.name,
        llm_model=llm.model,
        uptime_s=round(time.time() - state.started_at, 1),
    )
    logger.info(
        "Health: status=%s chunks=%d provider=%s model=%s uptime=%.1fs",
        status, payload.chunks_indexed,
        payload.llm_provider, payload.llm_model,
        payload.uptime_s,
    )
    return payload
