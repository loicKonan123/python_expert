"""Endpoint POST /api/run — exécution sandbox de code Python.

Le frontend appelle ce endpoint quand l'utilisateur clique le bouton ▶ Run
sur un bloc de code généré par le tuteur. La réponse contient stdout,
stderr, code de sortie et durée.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..config import settings
from ..sandbox import run_python


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["run"])


class RunRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    # Permet à un client de demander un timeout plus court, mais jamais plus long.
    timeout_s: float | None = Field(default=None, ge=1.0, le=30.0)


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool
    truncated: bool


@router.post("/run", response_model=RunResponse)
def run(req: RunRequest) -> RunResponse:
    """Exécute du code Python en sandbox et retourne le résultat."""
    timeout = min(
        req.timeout_s or settings.sandbox_timeout_s,
        settings.sandbox_timeout_s,
    )
    logger.info(
        "Sandbox run : %d caractères, timeout %.0fs",
        len(req.code), timeout,
    )
    result = run_python(
        code=req.code,
        timeout_s=timeout,
        max_output_bytes=settings.sandbox_max_output_kb * 1024,
    )
    return RunResponse(
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
        elapsed_ms=result.elapsed_ms,
        timeout=result.timeout,
        truncated=result.truncated,
    )
