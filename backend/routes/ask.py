"""Endpoint POST /api/ask — pipeline RAG complet en streaming SSE.

Pipeline complet (multi-turn + rewriting + filtre corpus) :
  1. RETRIEVAL : encode (potentiellement réécrit) la question, ChromaDB top-K
  2. PROMPT : assemble system + history + (chunks + question)
  3. GENERATION : streamée par le provider LLM (Ollama ou DeepSeek)

Flux d'événements SSE renvoyés :
  - event: rewrite   data: "version anglaise de la question" (si appliqué)
  - event: sources   data: [{source, section, text, score, corpus}, ...]
  - event: token     data: "fragment de texte..."
  - event: token     data: "..."
  - ...
  - event: done      data: ""

Les sauts de ligne dans `data:` sont échappés en "\\n".
"""
from __future__ import annotations

import json
import logging
import time
from typing import Iterator, Literal

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..config import settings
from ..llm_providers.base import LLMProviderError, Message
from ..prompts import (
    BOOST_FACTOR,
    INTENT_CORPUS_BOOST,
    build_messages,
    build_rewrite_messages,
)
from ..routing import choose_model


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ask"])


class HistoryMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=20000)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    k: int | None = Field(default=None, ge=1, le=20)
    # Liste des derniers échanges (sans le system, sans les chunks).
    # On garde uniquement le contenu lisible humain.
    history: list[HistoryMessage] = Field(default_factory=list, max_length=20)
    # Limiter la recherche à certains corpus. None / vide = tous.
    corpora: list[str] | None = None
    # Réécrire la question avant retrieval (recommandé pour follow-ups + FR).
    rewrite_query: bool = True
    # Phase 9 — Intent cliqué par l'utilisateur dans le ChatInput.
    # Si fourni : ajoute un paragraphe au system prompt + boost les corpus
    # listés dans INTENT_CORPUS_BOOST pour cet intent. Si None : comportement
    # identique à avant Phase 9.
    intent: Literal["generate", "explain", "refactor", "debug", "test", "optimize"] | None = None


def _sse(event: str, data: str | list | dict) -> bytes:
    """Encode un événement SSE."""
    if isinstance(data, (list, dict)):
        payload = json.dumps(data, ensure_ascii=False)
    else:
        payload = str(data)
    payload = payload.replace("\n", "\\n")
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


def _strip_thinking(piece_buffer: str, in_thinking: bool) -> tuple[str, str, bool]:
    """Retire les <think>...</think> émis par certains modèles."""
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


def _maybe_rewrite_query(
    llm,
    question: str,
    history: list[Message],
    *,
    should_rewrite: bool,
) -> tuple[str, str | None]:
    """Si la conversation contient déjà des échanges OU si la question semble
    être en français, on demande au LLM de réécrire en anglais autonome.

    Retourne (query_à_utiliser_pour_retrieval, query_réécrite_pour_log).
    Si pas de réécriture, le 2e élément est None.
    """
    if not should_rewrite:
        return question, None

    # Heuristique simple : si pas d'historique ET question apparemment anglaise,
    # on évite la réécriture (économie de coût et latence).
    if not history and _looks_english(question):
        return question, None

    rewrite_messages = build_rewrite_messages(question, history)
    try:
        t0 = time.perf_counter()
        rewritten = llm.complete(rewrite_messages).strip().strip('"').strip("'")
        elapsed_ms = (time.perf_counter() - t0) * 1000
        # Garde-fou : si la réécriture est trop courte / vide, on garde l'originale
        if len(rewritten) < 5 or len(rewritten) > 500:
            logger.warning("Réécriture suspecte (%d chars), on ignore.", len(rewritten))
            return question, None
        logger.info(
            "[REWRITE] %.0fms — \"%s\" → \"%s\"",
            elapsed_ms, _truncate(question, 60), _truncate(rewritten, 60),
        )
        return rewritten, rewritten
    except Exception as exc:
        logger.warning("Réécriture échouée (%s) — on utilise la question d'origine.", exc)
        return question, None


_ENGLISH_WORDS = {
    "the", "is", "are", "how", "what", "when", "where", "why", "does", "do",
    "of", "in", "to", "for", "with", "and", "or", "but", "this", "that",
    "show", "example", "use", "using", "between", "vs", "vs.",
}


def _looks_english(text: str) -> bool:
    """Heuristique rapide : si la question contient des mots anglais courants
    et pas trop de caractères accentués, on la considère anglaise.
    """
    words = text.lower().split()
    if not words:
        return False
    english_hits = sum(1 for w in words if w in _ENGLISH_WORDS)
    accents = sum(1 for c in text if c in "àâäéèêëïîôöùûüÿç")
    return english_hits >= 2 and accents <= 1


@router.post("/ask")
async def ask(req: AskRequest, request: Request) -> StreamingResponse:
    """Pipeline RAG complet : (rewrite) → retrieval → prompt → LLM → SSE."""
    rag = request.app.state.rag
    llm = request.app.state.llm
    k = req.k or settings.top_k
    t_start = time.perf_counter()

    # Convertit l'historique Pydantic en messages Message TypedDict.
    history: list[Message] = [
        {"role": h.role, "content": h.content}  # type: ignore[typeddict-item]
        for h in req.history
    ]

    logger.info(
        "Question reçue (k=%d, provider=%s, history=%d, corpora=%s) : %s",
        k, llm.name, len(history), req.corpora or "ALL",
        _truncate(req.question, 80),
    )

    def generator() -> Iterator[bytes]:
        # ===== Phase 0a : ROUTING =====
        # On choisit le modèle avant tout (utilisé pour le rewriting + generation).
        decision = choose_model(req.question, history_length=len(history))
        if decision.use_reasoner:
            yield _sse("model", decision.chosen_model)

        # ===== Phase 0b : QUERY REWRITING =====
        # On utilise Flash pour le rewriting même quand reasoner est choisi
        # (le rewriting est une tâche simple, pas la peine de payer le reasoner).
        retrieval_query, rewritten = _maybe_rewrite_query(
            llm, req.question, history,
            should_rewrite=req.rewrite_query,
        )
        if rewritten:
            yield _sse("rewrite", rewritten)

        # ===== Phase 1 : RETRIEVAL =====
        # Phase 9 : si un intent boost certains corpus, on retrieve 2x plus
        # de chunks puis on réordonne pour donner sa chance à un corpus
        # boosté qui serait juste sous le top-K.
        boost_corpora = (
            INTENT_CORPUS_BOOST.get(req.intent, []) if req.intent else []
        )
        retrieve_k = k * 2 if boost_corpora else k

        logger.info(
            "[RETRIEVAL] début (k=%d%s%s)",
            k,
            f", intent={req.intent}" if req.intent else "",
            f", boost={boost_corpora}" if boost_corpora else "",
        )
        try:
            t_retrieve = time.perf_counter()
            chunks = rag.retrieve(retrieval_query, k=retrieve_k, corpora=req.corpora)
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

        # Phase 9 — Boost intent : multiplie le score des chunks dont le
        # corpus est listé dans INTENT_CORPUS_BOOST, puis re-trie et coupe
        # au top-k réel. Si pas de boost actif, rien ne se passe.
        if boost_corpora:
            for c in chunks:
                if c.corpus in boost_corpora:
                    c.score *= BOOST_FACTOR
            chunks.sort(key=lambda c: c.score, reverse=True)
            chunks = chunks[:k]
            logger.info(
                "[RETRIEVAL] boost %s appliqué → top_corpora=%s",
                boost_corpora,
                [c.corpus for c in chunks[:3]],
            )

        logger.info(
            "[RETRIEVAL] %d chunks en %.0fms, top_score=%.3f, source=%s",
            len(chunks), retrieve_ms, chunks[0].score, chunks[0].source,
        )

        yield _sse("sources", [c.to_dict() for c in chunks])

        if chunks[0].score < 0.5:
            logger.warning(
                "[RETRIEVAL] qualité faible (top=%.3f) — réponse peu fiable probable",
                chunks[0].score,
            )

        # ===== Phase 2 : PROMPT BUILD =====
        messages = build_messages(
            req.question,
            [c.to_dict() for c in chunks],
            history=history,
            intent=req.intent,  # Phase 9 — injecte le prompt d'intent si fourni
        )
        total_prompt_chars = sum(len(m["content"]) for m in messages)
        logger.info(
            "[PROMPT] %d messages assemblés (%d caractères total)",
            len(messages), total_prompt_chars,
        )

        # ===== Phase 3 : GENERATION =====
        logger.info(
            "[GENERATION] début avec %s/%s",
            llm.name, decision.chosen_model,
        )
        buffer = ""
        in_thinking = False
        total_chars = 0
        first_token_at: float | None = None

        try:
            for piece in llm.stream(messages, model_override=decision.chosen_model):
                buffer += piece
                to_emit, buffer, in_thinking = _strip_thinking(buffer, in_thinking)
                if to_emit:
                    if first_token_at is None:
                        first_token_at = time.perf_counter()
                        logger.info(
                            "[GENERATION] premier token après %.2fs",
                            first_token_at - t_start,
                        )
                    total_chars += len(to_emit)
                    yield _sse("token", to_emit)
            if buffer and not in_thinking:
                yield _sse("token", buffer)
                total_chars += len(buffer)
        except LLMProviderError as exc:
            logger.error("[GENERATION] erreur provider %s : %s", llm.name, exc)
            yield _sse("token", f"\n\n[Erreur LLM ({llm.name}) : {exc}]")
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
            "X-Accel-Buffering": "no",
        },
    )


def _truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"
