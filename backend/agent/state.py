"""Structures d'état de l'agent (Phase 17)."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ToolCall:
    """Une action décidée par le LLM."""

    tool: str
    args: dict


@dataclass
class Observation:
    """Résultat d'un tool, tel que ré-injecté au LLM (texte lisible + statut).

    ``sources`` : références documentaires (pour search_docs) — remontées à l'UI
    pour afficher ce que l'agent a consulté pendant son cheminement.
    """

    ok: bool
    content: str = ""
    error: str | None = None
    sources: list[dict] | None = None

    def as_text(self) -> str:
        if self.ok:
            return self.content or "(ok, aucune sortie)"
        return f"ERREUR : {self.error or self.content or 'inconnue'}"


@dataclass
class Step:
    """Un tour complet de la boucle : pensée → action → observation."""

    index: int
    thought: str
    action: ToolCall | None
    observation: Observation | None = None
    done: bool = False


@dataclass
class AgentSession:
    """État complet d'une session agent."""

    id: str
    task: str
    steps: list[Step] = field(default_factory=list)
    state: str = "IDLE"            # IDLE|PLAN|ACT|OBSERVE|REFLECT|DONE|FAILED|NEEDS_USER
    max_iterations: int = 12
    finished: bool = False
    success: bool = False
    summary: str = ""
