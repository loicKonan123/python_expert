"""Endpoint POST /api/ask — pipeline RAG complet en streaming SSE.

Flux d'événements SSE renvoyés :
  - event: sources   data: [{source, section, text, score}, ...]
  - event: token     data: "fragment de texte..."
  - event: token     data: "..."
  - ...
  - event: done      data: ""

Les sauts de ligne dans `data:` sont échappés en "\\n" car SSE utilise '\n'
comme séparateur de champs.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Iterator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..config import settings
from ..ollama_client import OllamaError, stream as ollama_stream
from ..prompts import build_prompt


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ask"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    k: int | None = Field(default=None, ge=1, le=20)


def _sse(event: str, data: str | list | dict) -> bytes:
    """Encode un événement SSE. data peut être str ou JSON-sérialisable."""
    if isinstance(data, (list, dict)):
        payload = json.dumps(data, ensure_ascii=False)
    else:
        payload = str(data)
    payload = payload.replace("\n", "\\n")
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


def _strip_thinking(piece_buffer: str, in_thinking: bool) -> tuple[str, str, bool]:
    """Retire les sections <think>...</think> émises par certains modèles.

    Retourne (à_envoyer, reste_buffer, in_thinking_après).
    """
    to_emit = ""
    while True:
        if not in_thinking:
            idx = piece_buffer.find("<think>")
            if idx == -1:
                to_emit += piece_buffer
                piece_buffer = ""
                break
            to_emit += piece_buffer[:idx]
            piece_buffer = piece_buffer[idx + len("<think>"):]
            in_thinking = True
        else:
            idx = piece_buffer.find("</think>")
            if idx == -1:
                piece_buffer = ""
                break
            piece_buffer = piece_buffer[idx + len("</think>"):]
            in_thinking = False
    return to_emit, piece_buffer, in_thinking


@router.post("/ask")
async def ask(req: AskRequest, request: Request) -> StreamingResponse:
    """Pipeline RAG complet : retrieval → prompt → Ollama → streaming SSE."""
    rag = request.app.state.rag
    k = req.k or settings.top_k
    t_start = time.perf_counter()

    logger.info("Question reçue (k=%d) : %s", k, _truncate(req.question, 80))

    def generator() -> Iterator[bytes]:
        # ===== Phase 1 : RETRIEVAL =====
        logger.info("[RETRIEVAL] début (k=%d)", k)
        try:
            t_retrieve = time.perf_counter()
            chunks = rag.retrieve(req.question, k=k)
            retrieve_ms = (time.perf_counter() - t_retrieve) * 1000
        except Exception as exc:
            logger.exception("[RETRIEVAL] erreur : %s", exc)
            yield _sse("token", f"\n\n[Erreur retrieval : {exc}]")
            yield _sse("done", "")
            return

        if not chunks:
            logger.warning("[RETRIEVAL] aucun chunk pour : %s", req.question)
            yield _sse(
                "token",
                "Désolé, je n'ai trouvé aucun passage pertinent dans la documentation.",
            )
            yield _sse("done", "")
            return

        logger.info(
            "[RETRIEVAL] %d chunks en %.0fms, top_score=%.3f, source=%s",
            len(chunks), retrieve_ms, chunks[0].score, chunks[0].source,
        )

        yield _sse("sources", [c.to_dict() for c in chunks])

        # Avertissement si la qualité de récupération est faible.
        if chunks[0].score < 0.5:
            logger.warning(
                "[RETRIEVAL] qualité faible (top=%.3f) — réponse peu fiable probable",
                chunks[0].score,
            )

        # ===== Phase 2 : PROMPT BUILD =====
        prompt = build_prompt(req.question, [c.to_dict() for c in chunks])
        logger.info("[PROMPT] %d caractères assemblés (système + sources + question)",
                    len(prompt))

        # ===== Phase 3 : GENERATION =====
        logger.info("[GENERATION] début avec %s", settings.ollama_model)
        buffer = ""
        in_thinking = False
        total_chars = 0
        first_token_at: float | None = None

        try:
            for piece in ollama_stream(prompt):
                buffer += piece
                to_emit, buffer, in_thinking = _strip_thinking(buffer, in_thinking)
                if to_emit:
                    if first_token_at is None:
                        first_token_at = time.perf_counter()
                        logger.info(
                            "[GENERATION] premier token reçu après %.1fs",
                            first_token_at - t_start,
                        )
                    total_chars += len(to_emit)
                    yield _sse("token", to_emit)
            if buffer and not in_thinking:
                yield _sse("token", buffer)
                total_chars += len(buffer)
        except OllamaError as exc:
            logger.error("[GENERATION] erreur Ollama : %s", exc)
            yield _sse("token", f"\n\n[Erreur Ollama : {exc}]")
        except Exception as exc:
            logger.exception("[GENERATION] erreur inattendue : %s", exc)
            yield _sse("token", f"\n\n[Erreur serveur : {exc}]")

        yield _sse("done", "")
        elapsed = time.perf_counter() - t_start
        logger.info(
            "[DONE] question répondue en %.1fs (%d chars streamés)",
            elapsed, total_chars,
        )

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # désactive un éventuel buffering proxy
        },
    )


def _truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"
