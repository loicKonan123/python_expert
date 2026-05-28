"""Provider Ollama : LLM local via le binaire ollama (port 11434).

Avantage : 100% autonome, aucune dépendance réseau externe.
Inconvénient : qualité limitée par la taille du modèle qui tient sur le CPU,
et vitesse de génération bornée (~10 tok/s sur CPU pour un 7B).
"""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Iterator

from ..config import settings
from .base import LLMProviderError


logger = logging.getLogger(__name__)


class OllamaProvider:
    name = "ollama"

    def __init__(self) -> None:
        self.model = settings.ollama_model
        self.url = settings.ollama_url
        self.keep_alive = settings.ollama_keep_alive
        self.temperature = settings.ollama_temperature
        self.timeout = settings.ollama_timeout_s

    # ---------------------------------------------------------------- warmup
    def warmup(self) -> None:
        """Force Ollama à charger le modèle en RAM avant la première requête.

        Sans ça, le premier visiteur attend 10-30s qu'Ollama charge le modèle.
        Avec ça, le serveur démarre prêt à répondre.
        """
        logger.info("Pré-chauffage Ollama : %s", self.model)
        t0 = time.perf_counter()
        payload = json.dumps({
            "model": self.model,
            "prompt": "ok",
            "stream": False,
            "keep_alive": self.keep_alive,
            "options": {"num_predict": 1},
        }).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        try:
            urllib.request.urlopen(request, timeout=120).read()
        except urllib.error.URLError as exc:
            logger.warning(
                "Échec du warmup Ollama (%s). Le serveur démarre quand même — "
                "vérifie qu'Ollama tourne sur %s.",
                exc, self.url,
            )
            return
        logger.info("Ollama prêt (%.1fs)", time.perf_counter() - t0)

    # ---------------------------------------------------------------- stream
    def stream(self, system: str, user: str) -> Iterator[str]:
        """Streame la réponse d'Ollama.

        Ollama supporte l'endpoint /api/chat avec messages — on l'utilise
        pour bénéficier du KV-cache côté Ollama sur le system prompt.
        """
        chat_url = self.url.replace("/api/generate", "/api/chat")
        payload = json.dumps({
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": True,
            "keep_alive": self.keep_alive,
            "options": {"temperature": self.temperature},
        }).encode("utf-8")
        request = urllib.request.Request(
            chat_url,
            data=payload,
            headers={"Content-Type": "application/json"},
        )

        try:
            response = urllib.request.urlopen(request, timeout=self.timeout)
        except urllib.error.URLError as exc:
            raise LLMProviderError(f"Connexion à Ollama échouée : {exc}") from exc

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
            # /api/chat renvoie {message: {content: "..."}, done: bool}
            piece = data.get("message", {}).get("content", "")
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
