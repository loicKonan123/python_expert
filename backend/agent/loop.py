"""Boucle agent — la machine à états (Phase 17).

run_agent() enchaîne les tours : construire le contexte → appeler le LLM →
parser la sortie JSON → exécuter le tool → observer → recommencer, jusqu'à
`done` (vérifié), max_iterations, ou blocage.

Garde-fous : max itérations, détection de boucle (même action répétée),
JSON invalide toléré (on renvoie l'erreur au LLM pour qu'il se corrige).
"""
from __future__ import annotations

import json
import logging
from typing import Callable

from ..llm_providers.base import Message
from .context import build_messages, parse_agent_output
from .executor import Executor
from .state import AgentSession, Observation, Step, ToolCall
from .tools import dispatch
from .workspace import Workspace


logger = logging.getLogger(__name__)

# Type d'un provider LLM minimal : on n'a besoin que de complete().
LLMComplete = Callable[[list[Message]], str]


def _signature(call: ToolCall | None) -> str:
    """Empreinte d'une action pour détecter les boucles (mêmes args identiques)."""
    if call is None:
        return "none"
    return call.tool + "|" + json.dumps(call.args, sort_keys=True, ensure_ascii=False)


def run_agent(
    session: AgentSession,
    llm_complete: LLMComplete,
    workspace: Workspace,
    executor: Executor,
    rag=None,
    on_step: Callable[[Step], None] | None = None,
) -> AgentSession:
    """Exécute la boucle agent jusqu'à terminaison. Mute et renvoie `session`."""
    session.state = "ACT"
    recent_sigs: list[str] = []

    for i in range(session.max_iterations):
        # 1) Contexte + appel LLM
        messages = build_messages(session)
        try:
            raw = llm_complete(messages)
        except Exception as exc:
            logger.exception("[AGENT] appel LLM échoué : %s", exc)
            session.state = "FAILED"
            session.summary = f"Appel LLM échoué : {exc}"
            break

        # 2) Parsing de la sortie
        parsed = parse_agent_output(raw)
        if parsed is None:
            # JSON invalide → on le signale au LLM via une observation, il se corrige.
            step = Step(
                index=i,
                thought="(sortie non-JSON)",
                action=None,
                observation=Observation(
                    False,
                    error="Ta réponse n'était pas un objet JSON valide. "
                    "Réponds UNIQUEMENT avec {\"thought\":..., \"action\":..., \"done\":...}.",
                ),
            )
            session.steps.append(step)
            if on_step:
                on_step(step)
            continue

        thought = str(parsed.get("thought", "")).strip()
        done = bool(parsed.get("done", False))
        raw_action = parsed.get("action")

        # 3) Terminaison demandée par l'agent
        if done or raw_action is None:
            step = Step(index=i, thought=thought, action=None, done=True)
            session.steps.append(step)
            if on_step:
                on_step(step)
            session.state = "DONE"
            session.finished = True
            session.success = True
            session.summary = str(parsed.get("summary", thought)) or "Terminé."
            logger.info("[AGENT] terminé à l'itération %d", i)
            break

        # 4) Construction + garde-fou anti-boucle
        action = ToolCall(
            tool=str(raw_action.get("tool", "")),
            args=raw_action.get("args") or {},
        )
        sig = _signature(action)
        recent_sigs.append(sig)
        if recent_sigs[-3:].count(sig) >= 3:
            step = Step(
                index=i, thought=thought, action=action,
                observation=Observation(
                    False, error="Boucle détectée (même action répétée 3×). "
                    "Change d'approche ou termine.",
                ),
            )
            session.steps.append(step)
            if on_step:
                on_step(step)
            continue

        # 5) Exécution du tool → observation
        obs = dispatch(action, workspace, executor, rag=rag)
        step = Step(index=i, thought=thought, action=action, observation=obs)
        session.steps.append(step)
        if on_step:
            on_step(step)
        logger.info("[AGENT] #%d %s → %s", i, action.tool, "ok" if obs.ok else "err")

    else:
        # Boucle épuisée sans `done`
        session.state = "FAILED"
        session.finished = True
        session.success = False
        session.summary = (
            f"Limite de {session.max_iterations} itérations atteinte sans "
            "achèvement vérifié."
        )
        logger.warning("[AGENT] max itérations atteint")

    return session
