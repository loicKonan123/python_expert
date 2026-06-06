"""Endpoints d'exécution Python en sandbox.

Deux modes :
  - One-shot (legacy) : aucun session_id → subprocess jetable à chaque appel.
    Pratique pour des tests rapides où l'état n'importe pas.
  - Kernel persistant (notebook-style) : session_id fourni → le kernel survit
    entre les appels, variables/classes/imports persistent. C'est le mode
    par défaut pour le tuteur.

Endpoints :
  POST /api/run                       — exécute du code
  POST /api/kernel/{session_id}/restart — tue + recrée le kernel
  GET  /api/kernel/stats              — état du pool de kernels
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..kernel import get_manager
from ..sandbox import run_python


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["run"])


class RunRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    timeout_s: float | None = Field(default=None, ge=1.0, le=30.0)
    # Si fourni, on utilise un kernel persistant pour cette session.
    # Si absent, on retombe sur le sandbox one-shot.
    session_id: str | None = Field(default=None, max_length=100)


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool
    truncated: bool
    # Champs spécifiques au mode kernel
    session_id: str | None = None
    restarted: bool = False


@router.post("/run", response_model=RunResponse)
def run(req: RunRequest) -> RunResponse:
    """Exécute du code Python.

    Si ``session_id`` est fourni, on utilise un kernel persistant
    (notebook-style — variables persistent entre les appels).
    Sinon, exécution one-shot dans un subprocess jetable.
    """
    timeout = min(
        req.timeout_s or settings.sandbox_timeout_s,
        settings.sandbox_timeout_s,
    )

    # ------- Mode kernel persistant -------
    if req.session_id:
        logger.info(
            "Kernel run : session=%s, %d caractères, timeout %.0fs",
            req.session_id[:8], len(req.code), timeout,
        )
        manager = get_manager()
        try:
            kernel = manager.get_or_create(req.session_id)
            result = kernel.execute(
                code=req.code,
                timeout_s=timeout,
                max_output_bytes=settings.sandbox_max_output_kb * 1024,
            )
            # Si timeout → le kernel peut être dans un état douteux. On le
            # redémarre proactivement pour les requêtes suivantes.
            restarted = False
            if result.timeout:
                logger.warning(
                    "[KERNEL %s] timeout → restart auto",
                    req.session_id[:8],
                )
                manager.restart(req.session_id)
                restarted = True
            return RunResponse(
                stdout=result.stdout,
                stderr=result.stderr,
                exit_code=result.exit_code,
                elapsed_ms=result.elapsed_ms,
                timeout=result.timeout,
                truncated=result.truncated,
                session_id=req.session_id,
                restarted=restarted,
            )
        except RuntimeError as exc:
            # Kernel mort : on essaie un restart et on signale au client.
            logger.error("Kernel %s indisponible : %s — restart", req.session_id[:8], exc)
            try:
                manager.restart(req.session_id)
            except Exception as exc2:
                logger.exception("Restart kernel échoué : %s", exc2)
                raise HTTPException(status_code=500, detail=str(exc2))
            return RunResponse(
                stdout="",
                stderr=f"[Kernel a été redémarré : {exc}. Cliquer Run à nouveau.]",
                exit_code=-2,
                elapsed_ms=0,
                timeout=False,
                truncated=False,
                session_id=req.session_id,
                restarted=True,
            )

    # ------- Mode one-shot (legacy) -------
    logger.info(
        "Sandbox one-shot run : %d caractères, timeout %.0fs",
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


@router.post("/kernel/{session_id}/restart")
def restart_kernel(session_id: str) -> dict:
    """Tue le kernel actuel pour cette session et en crée un neuf."""
    if not session_id or len(session_id) > 100:
        raise HTTPException(status_code=400, detail="session_id invalide")
    logger.info("Restart kernel demandé : session=%s", session_id[:8])
    manager = get_manager()
    try:
        manager.restart(session_id)
        return {"restarted": True, "session_id": session_id}
    except Exception as exc:
        logger.exception("Restart kernel échoué : %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/kernel/stats")
def kernel_stats() -> dict:
    """Snapshot du pool de kernels (utile pour debug + UI)."""
    return get_manager().stats()
