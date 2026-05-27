"""Client Ollama : streaming HTTP + warmup."""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Iterator

from .config import settings


logger = logging.getLogger(__name__)


class OllamaError(RuntimeError):
    """Erreur de communication avec le serveur Ollama local."""


def warmup() -> None:
    """Pré-charge le modèle Ollama en RAM avant la première vraie requête.

    Sans ça, le premier visiteur attend 10-30s pour qu'Ollama charge le modèle.
    Avec ça, le serveur démarre prêt à répondre.
    """
    logger.info("Pré-chauffage Ollama : %s", settings.ollama_model)
    t0 = time.perf_counter()
    payload = json.dumps({
        "model": settings.ollama_model,
        "prompt": "ok",
        "stream": False,
        "keep_alive": settings.ollama_keep_alive,
        "options": {"num_predict": 1},
    }).encode("utf-8")
    request = urllib.request.Request(
        settings.ollama_url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(request, timeout=120).read()
    except urllib.error.URLError as exc:
        logger.warning(
            "Échec du warmup Ollama (%s). Le serveur démarre quand même — "
            "vérifie qu'Ollama tourne sur %s.",
            exc, settings.ollama_url,
        )
        return
    logger.info("Ollama prêt (%.1fs)", time.perf_counter() - t0)


def stream(prompt: str) -> Iterator[str]:
    """Yield les morceaux de texte renvoyés par Ollama au fur et à mesure.

    Lève OllamaError si la connexion échoue. Les erreurs réseau pendant le
    streaming s'arrêtent simplement (yield-stop sans exception).
    """
    payload = json.dumps({
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": True,
        "keep_alive": settings.ollama_keep_alive,
        "options": {"temperature": settings.ollama_temperature},
    }).encode("utf-8")
    request = urllib.request.Request(
        settings.ollama_url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        response = urllib.request.urlopen(request, timeout=settings.ollama_timeout_s)
    except urllib.error.URLError as exc:
        raise OllamaError(f"Connexion à Ollama échouée : {exc}") from exc

    total_tokens = 0
    t0 = time.perf_counter()
    for line in response:
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            logger.debug("Ligne JSON invalide ignorée : %r", line[:80])
            continue
        piece = data.get("response", "")
        if piece:
            total_tokens += 1
            yield piece
        if data.get("done"):
            break

    elapsed = time.perf_counter() - t0
    rate = total_tokens / elapsed if elapsed else 0
    logger.info(
        "Ollama: %d tokens en %.1fs (%.1f tok/s)",
        total_tokens, elapsed, rate,
    )
