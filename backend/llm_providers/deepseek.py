"""Provider DeepSeek : API HTTP compatible OpenAI Chat Completions.

Avantage : qualité de réponse nettement supérieure aux 7B locaux, 5-50× plus
rapide qu'Ollama CPU, et premier token sous la seconde.
Inconvénient : payant (très peu cher — ~0.0008$ par question avec V4-Flash),
dépend d'internet, données envoyées à un fournisseur tiers.

Documentation : https://platform.deepseek.com/api-docs/
"""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Iterator

from ..config import settings
from ..usage_tracker import tracker
from .base import LLMProviderError, Message


logger = logging.getLogger(__name__)


class DeepSeekProvider:
    name = "deepseek"

    def __init__(self) -> None:
        if not settings.deepseek_api_key:
            raise LLMProviderError(
                "PYEXPERT_DEEPSEEK_API_KEY n'est pas défini. "
                "Crée un fichier .env à la racine du projet avec :\n"
                "  PYEXPERT_DEEPSEEK_API_KEY=sk-xxxxxx\n"
                "Génère une clé sur https://platform.deepseek.com/api_keys"
            )
        self.api_key = settings.deepseek_api_key.get_secret_value()
        self.model = settings.deepseek_model
        self.url = settings.deepseek_url
        self.temperature = settings.deepseek_temperature
        self.timeout = settings.deepseek_timeout_s

    # ---------------------------------------------------------------- warmup
    def warmup(self) -> None:
        """Vérifie que la clé API est valide avec un appel minimal."""
        logger.info("Vérification de la connectivité DeepSeek...")
        t0 = time.perf_counter()
        payload = json.dumps({
            "model": self.model,
            "messages": [{"role": "user", "content": "ok"}],
            "stream": False,
            "max_tokens": 1,
        }).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )
        try:
            urllib.request.urlopen(request, timeout=15).read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:300]
            logger.warning(
                "Échec authentification DeepSeek (HTTP %d) : %s. "
                "Le serveur démarre quand même, mais les requêtes échoueront.",
                exc.code, body,
            )
            return
        except urllib.error.URLError as exc:
            logger.warning(
                "Échec de connexion à DeepSeek (%s). Le serveur démarre quand même.",
                exc,
            )
            return
        logger.info(
            "DeepSeek joignable et clé valide (%.0fms) — modèle=%s",
            (time.perf_counter() - t0) * 1000,
            self.model,
        )

    # ---------------------------------------------------------------- stream
    def stream(
        self,
        messages: list[Message],
        model_override: str | None = None,
    ) -> Iterator[str]:
        """Streame la réponse de DeepSeek via Server-Sent Events.

        ``model_override`` permet à l'auto-routing de choisir un autre modèle
        (ex: passer à ``deepseek-reasoner`` pour une question complexe) sans
        reconfigurer le provider.
        """
        model = model_override or self.model
        payload = json.dumps({
            "model": model,
            "messages": messages,
            "stream": True,
            "temperature": self.temperature,
        }).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )

        try:
            response = urllib.request.urlopen(request, timeout=self.timeout)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:500]
            raise LLMProviderError(f"DeepSeek HTTP {exc.code} : {body}") from exc
        except urllib.error.URLError as exc:
            raise LLMProviderError(f"Connexion à DeepSeek échouée : {exc}") from exc

        total_chunks = 0
        usage: dict | None = None
        t0 = time.perf_counter()

        for raw_line in response:
            line = raw_line.strip()
            if not line or not line.startswith(b"data:"):
                continue
            data = line[5:].strip()
            if data == b"[DONE]":
                break
            try:
                obj = json.loads(data)
            except json.JSONDecodeError:
                logger.debug("Ligne JSON DeepSeek invalide ignorée : %r", data[:80])
                continue

            choices = obj.get("choices", [])
            if choices:
                delta = choices[0].get("delta", {})
                content = delta.get("content")
                if content:
                    total_chunks += 1
                    yield content

            if obj.get("usage"):
                usage = obj["usage"]

        elapsed = time.perf_counter() - t0
        if usage:
            prompt_t = usage.get("prompt_tokens", 0)
            completion_t = usage.get("completion_tokens", 0)
            cached_t = usage.get("prompt_cache_hit_tokens", 0)
            rate = completion_t / elapsed if elapsed else 0
            logger.info(
                "DeepSeek (%s): prompt=%d (cached=%d) completion=%d en %.1fs (%.1f tok/s)",
                model, prompt_t, cached_t, completion_t, elapsed, rate,
            )

            entry = tracker.record(
                provider=self.name,
                model=model,
                prompt=prompt_t,
                cached=cached_t,
                completion=completion_t,
            )
            logger.info(
                "Coût : cette req = $%.6f | session = %d req, $%.4f cumulé "
                "(%d tokens entrée + %d sortie, %d cachés)",
                entry.request_cost_usd,
                entry.total_requests,
                entry.total_cost_usd,
                entry.total_prompt_tokens,
                entry.total_completion_tokens,
                entry.total_cached_tokens,
            )
        else:
            logger.info(
                "DeepSeek: %d chunks en %.1fs (pas d'usage rapporté)",
                total_chunks, elapsed,
            )

    # -------------------------------------------------------------- complete
    def complete(
        self,
        messages: list[Message],
        model_override: str | None = None,
    ) -> str:
        """Version non-streamée — efficace pour le query rewriting."""
        return "".join(self.stream(messages, model_override=model_override))
