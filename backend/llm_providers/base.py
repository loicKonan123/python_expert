"""Interface commune à tous les providers LLM."""
from __future__ import annotations

from typing import Iterator, Protocol, runtime_checkable


@runtime_checkable
class LLMProvider(Protocol):
    """Contrat qu'un provider LLM doit respecter.

    Tous les providers exposent :
      - ``name`` : nom court pour les logs (ex: "ollama", "deepseek")
      - ``model`` : nom du modèle effectivement utilisé (ex: "qwen2.5-coder:7b")
      - ``warmup()`` : pré-chargement / vérification (appelé une fois au startup)
      - ``stream(system, user)`` : génère la réponse en streaming, yield-by-token
    """

    name: str
    model: str

    def warmup(self) -> None:
        """Pré-charge le modèle ou vérifie la connectivité.

        Ne doit JAMAIS lever — en cas d'échec, log un warning et laisse le
        serveur démarrer (l'erreur réelle remontera au premier appel).
        """
        ...

    def stream(self, system: str, user: str) -> Iterator[str]:
        """Génère la réponse au prompt et yield les morceaux de texte.

        Args:
            system: prompt système (instructions, rôle).
            user: message utilisateur (avec le contexte RAG déjà intégré).

        Yields:
            Fragments de texte au fur et à mesure de la génération.

        Raises:
            LLMProviderError: si la communication avec le LLM échoue.
        """
        ...


class LLMProviderError(RuntimeError):
    """Erreur de communication avec un provider LLM."""
