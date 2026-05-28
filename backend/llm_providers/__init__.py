"""Providers LLM interchangeables.

Deux providers disponibles :
  - ollama : LLM local via Ollama (autonomie totale, plus lent)
  - deepseek : API DeepSeek (qualité supérieure, payant mais très peu cher)

Le provider est choisi via ``settings.llm_provider`` (env: PYEXPERT_LLM_PROVIDER).
"""
from __future__ import annotations

import logging

from .base import LLMProvider


logger = logging.getLogger(__name__)


def get_provider() -> LLMProvider:
    """Factory : retourne l'instance de provider configurée."""
    # Import paresseux pour ne pas charger les deux providers inutilement.
    from ..config import settings

    provider_name = settings.llm_provider.lower()
    if provider_name == "deepseek":
        from .deepseek import DeepSeekProvider
        provider: LLMProvider = DeepSeekProvider()
    elif provider_name == "ollama":
        from .ollama import OllamaProvider
        provider = OllamaProvider()
    else:
        raise ValueError(
            f"Provider LLM inconnu : '{provider_name}'. "
            f"Valeurs valides : ollama, deepseek."
        )

    logger.info("Provider LLM sélectionné : %s (modèle=%s)", provider.name, provider.model)
    return provider


__all__ = ["LLMProvider", "get_provider"]
