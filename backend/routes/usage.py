"""Endpoint /api/usage — cumul tokens + coût estimé pour la session."""
from __future__ import annotations

import logging

from fastapi import APIRouter

from ..usage_tracker import tracker


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["usage"])


@router.get("/usage")
def usage() -> dict:
    """Snapshot du compteur depuis le démarrage du backend.

    Note : le cumul repart à zéro à chaque redémarrage. Pour le total
    facturé réel, consulter le dashboard DeepSeek.
    """
    snap = tracker.snapshot()
    logger.info(
        "Usage check: %d req, $%.4f, %d tokens",
        snap["requests"], snap["total_cost_usd"], snap["total_tokens"],
    )
    return snap
