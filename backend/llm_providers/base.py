"""Interface commune à tous les providers LLM."""
from __future__ import annotations

from typing import Iterator, Literal, Protocol, TypedDict, runtime_checkable


Role = Literal["system", "user", "assistant"]


class Message(TypedDict):
    """Un message dans le fil de conversation."""
    role: Role
    content: str


@runtime_checkable
class LLMProvider(Protocol):
    """Contrat qu'un provider LLM doit respecter.

    Tous les providers exposent :
      - ``name`` : nom court pour les logs (ex: "ollama", "deepseek")
      - ``model`` : nom du modèle effectivement utilisé
      - ``warmup()`` : pré-chargement / vérification (appelé une fois au startup)
      - ``stream(messages)`` : génère la réponse en streaming, yield-by-token

    L'argument ``messages`` est la conversation complète, dans l'ordre
    chronologique : système d'abord, puis user/assistant en alternance,
    et le dernier message est toujours user (la question à répondre).
    """

    name: str
    model: str

    def warmup(self) -> None:
        """Pré-charge le modèle ou vérifie la connectivité.

        Ne doit JAMAIS lever — en cas d'échec, log un warning et laisse le
        serveur démarrer (l'erreur réelle remontera au premier appel).
        """
        ...

    def stream(
        self,
        messages: list[Message],
        model_override: str | None = None,
    ) -> Iterator[str]:
        """Génère la réponse à partir de la conversation et yield les morceaux.

        Args:
            messages: liste ordonnée [system, user, assistant, user, ...] —
                le dernier doit être un user.
            model_override: si fourni, utilise ce modèle au lieu de
                ``self.model`` (utile pour l'auto-routing flash/reasoner).
                Les providers locaux peuvent l'ignorer.

        Yields:
            Fragments de texte au fur et à mesure de la génération.

        Raises:
            LLMProviderError: si la communication avec le LLM échoue.
        """
        ...

    def complete(
        self,
        messages: list[Message],
        model_override: str | None = None,
    ) -> str:
        """Version non-streamée — utile pour query rewriting et appels courts."""
        ...


class LLMProviderError(RuntimeError):
    """Erreur de communication avec un provider LLM."""
