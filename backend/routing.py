"""Décide quel modèle utiliser pour une question donnée.

Stratégie « auto-routing » : les questions simples vont au modèle rapide
(deepseek-chat = V4-Flash non-thinking), les questions complexes au modèle
de raisonnement (deepseek-reasoner = V4-Flash thinking).

Heuristique basée sur :
  - longueur du texte,
  - présence de mots-clés de raisonnement (« pourquoi », « compare »...),
  - profondeur de l'historique (les follow-ups tendent à être plus complexes),
  - nombre de questions dans le message.

Activable / désactivable via PYEXPERT_ENABLE_AUTO_ROUTING.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from .config import settings


logger = logging.getLogger(__name__)


# Mots-clés qui suggèrent un besoin de raisonnement, pas juste de récitation
_REASONING_KEYWORDS_FR = (
    "pourquoi", "compare", "comparer", "différence", "expliquer en détail",
    "analyse", "analyser", "débug", "optimiser", "complexité",
    "architecture", "trade-off", "piège", "raisonn", "étape par étape",
    "algorithme", "performance", "fuite de mémoire", "design",
)
_REASONING_KEYWORDS_EN = (
    "why", "compare", "difference", "explain in depth", "trace through",
    "step by step", "analyze", "debug", "optimize", "complexity",
    "algorithm", "design", "architecture", "trade-off", "tradeoff",
    "edge case", "pitfall", "memory leak", "race condition", "reason",
)


@dataclass
class RoutingDecision:
    use_reasoner: bool
    score: float
    chosen_model: str
    reason: str


def score_complexity(question: str, history_length: int) -> float:
    """Score de complexité entre 0 (trivial) et 1 (complexe).

    Args:
        question: texte de la question utilisateur.
        history_length: nombre de messages dans l'historique de conversation.
    """
    score = 0.0
    q_lower = question.lower()

    # Longueur — questions longues = souvent plus complexes
    n = len(question)
    if n > 100:
        score += 0.15
    if n > 200:
        score += 0.15
    if n > 400:
        score += 0.10

    # Présence de mots-clés de raisonnement (cap à 0.40)
    keyword_hits = 0
    for kw in _REASONING_KEYWORDS_FR + _REASONING_KEYWORDS_EN:
        if kw in q_lower:
            keyword_hits += 1
    score += min(keyword_hits * 0.15, 0.40)

    # Multi-tour : un follow-up à 4+ messages est probablement complexe
    if history_length >= 2:
        score += 0.10
    if history_length >= 4:
        score += 0.10

    # Plusieurs questions dans le même message
    qmarks = question.count("?")
    if qmarks >= 2:
        score += 0.15

    # Présence de blocs de code (l'utilisateur partage du code à analyser)
    if "```" in question or question.count("\n") >= 5:
        score += 0.15

    return min(score, 1.0)


def choose_model(question: str, history_length: int) -> RoutingDecision:
    """Décide quel modèle DeepSeek utiliser pour la question."""
    if not settings.enable_auto_routing:
        return RoutingDecision(
            use_reasoner=False,
            score=0.0,
            chosen_model=settings.deepseek_model,
            reason="auto-routing désactivé",
        )

    score = score_complexity(question, history_length)
    use_reasoner = score >= settings.complexity_threshold
    chosen = (
        settings.deepseek_reasoner_model
        if use_reasoner
        else settings.deepseek_model
    )
    reason = (
        f"score={score:.2f} >= seuil {settings.complexity_threshold:.2f}"
        if use_reasoner
        else f"score={score:.2f} < seuil {settings.complexity_threshold:.2f}"
    )
    logger.info(
        "[ROUTING] %s → %s (%s)",
        "REASONER" if use_reasoner else "FLASH",
        chosen, reason,
    )
    return RoutingDecision(
        use_reasoner=use_reasoner,
        score=score,
        chosen_model=chosen,
        reason=reason,
    )
