"""Suivi cumulé de la consommation LLM pour la session courante.

Compte les tokens et estime le coût en $ pour chaque requête + le cumul
depuis le démarrage du backend. Pas de persistance — repartira à zéro au
prochain restart (volontaire : pour le total réel, voir le dashboard DeepSeek).
"""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass


logger = logging.getLogger(__name__)


# Tarifs en $/1M tokens — (cache miss, cache hit, output)
# Source : https://api-docs.deepseek.com/quick_start/pricing
# Mis à jour au 2026-05-27. Le tarif V4-Pro a une promo -75% jusqu'au 2026-05-31.
PRICING_USD_PER_M = {
    # V4-Flash (deepseek-chat & deepseek-reasoner sont des alias)
    "deepseek-chat":      (0.14,  0.028,    0.28),
    "deepseek-reasoner":  (0.14,  0.028,    0.28),
    "deepseek-v4-flash":  (0.14,  0.028,    0.28),
    # V4-Pro (prix promo -75% jusqu'au 2026-05-31, ensuite ×4)
    "deepseek-v4-pro":    (0.435, 0.003625, 0.87),
}


def compute_cost_usd(model: str, prompt: int, cached: int, completion: int) -> float:
    """Estime le coût en USD d'un appel LLM.

    Args:
        model: nom du modèle DeepSeek (ex: "deepseek-chat").
        prompt: total tokens d'entrée (incluant la part cachée).
        cached: tokens d'entrée servis depuis le cache.
        completion: tokens générés en sortie.

    Returns:
        Coût en dollars. 0.0 si le modèle n'a pas de tarif connu (ex: Ollama).
    """
    prices = PRICING_USD_PER_M.get(model)
    if not prices:
        return 0.0
    cache_miss_price, cache_hit_price, output_price = prices
    non_cached = max(prompt - cached, 0)
    cost = (
        non_cached * cache_miss_price
        + cached * cache_hit_price
        + completion * output_price
    ) / 1_000_000
    return cost


@dataclass
class UsageEntry:
    """Résultat d'un seul appel LLM."""
    request_cost_usd: float
    total_cost_usd: float
    total_requests: int
    total_prompt_tokens: int
    total_cached_tokens: int
    total_completion_tokens: int


class SessionTracker:
    """Compteur thread-safe de la consommation LLM sur la session courante."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.started_at = time.time()
        self.requests = 0
        self.prompt_tokens = 0
        self.cached_prompt_tokens = 0
        self.completion_tokens = 0
        self.total_cost_usd = 0.0

    def record(
        self,
        provider: str,
        model: str,
        prompt: int,
        cached: int,
        completion: int,
    ) -> UsageEntry:
        """Enregistre une requête et retourne le détail (coût req + cumul)."""
        cost = compute_cost_usd(model, prompt, cached, completion)
        with self._lock:
            self.requests += 1
            self.prompt_tokens += prompt
            self.cached_prompt_tokens += cached
            self.completion_tokens += completion
            self.total_cost_usd += cost
            return UsageEntry(
                request_cost_usd=cost,
                total_cost_usd=self.total_cost_usd,
                total_requests=self.requests,
                total_prompt_tokens=self.prompt_tokens,
                total_cached_tokens=self.cached_prompt_tokens,
                total_completion_tokens=self.completion_tokens,
            )

    def snapshot(self) -> dict:
        """Vue lecture-seule du compteur (pour /api/usage)."""
        with self._lock:
            return {
                "requests": self.requests,
                "prompt_tokens": self.prompt_tokens,
                "cached_prompt_tokens": self.cached_prompt_tokens,
                "completion_tokens": self.completion_tokens,
                "total_tokens": self.prompt_tokens + self.completion_tokens,
                "total_cost_usd": round(self.total_cost_usd, 6),
                "uptime_s": round(time.time() - self.started_at, 1),
            }


# Singleton — partagé par tous les providers et endpoints.
tracker = SessionTracker()
