"""Construction du contexte (messages) de chaque tour + parsing de la sortie LLM.

Protocole ReAct : à chaque tour, le LLM reçoit la tâche + l'historique des
actions/observations, et doit répondre en JSON STRICT :

    {"thought": "...", "action": {"tool": "...", "args": {...}}, "done": false}

ou, quand la tâche est finie :

    {"thought": "...", "action": null, "done": true, "summary": "..."}
"""
from __future__ import annotations

import json
import re

from ..llm_providers.base import Message
from .state import AgentSession
from .tools import TOOLS_SPEC


AGENT_SYSTEM_PROMPT = f"""Tu es un agent de développement autonome, spécialisé
UNIQUEMENT dans les technologies dont la documentation est indexée : Python,
FastAPI, Pydantic, SQLAlchemy, pytest, httpx, Next.js, TypeScript, Tailwind,
Zod, TanStack Query, Vitest, HTML, CSS, JavaScript, C#, ASP.NET Core, EF Core,
12-Factor, Docker, GitHub Actions.

Tu travailles dans un workspace isolé. Tu écris du code, tu l'exécutes, tu lis
les erreurs, et tu te corriges JUSQU'À ce que ça marche vraiment.

## Règles absolues
1. Réponds TOUJOURS avec un UNIQUE objet JSON valide, rien d'autre autour.
2. UNE seule action par tour.
3. Tu ne DÉCLARES pas la tâche finie sans l'avoir VÉRIFIÉE (exécute les tests).
4. Si tu n'es pas certain d'une API, utilise search_docs AVANT de coder.
5. Si la tâche sort de ton périmètre (techno non indexée), dis-le dans
   "thought", mets "done": true et explique la limite dans "summary".
6. Après une erreur, lis le message, corrige la cause — ne répète pas la même
   action à l'identique.

{TOOLS_SPEC}

## Format de réponse (JSON strict)
{{"thought": "ton raisonnement", "action": {{"tool": "write_file", "args": {{"path": "x.py", "content": "..."}}}}, "done": false}}

Quand tout est vérifié et terminé :
{{"thought": "...", "action": null, "done": true, "summary": "ce que j'ai livré"}}
"""


def build_messages(session: AgentSession, max_detailed_steps: int = 8) -> list[Message]:
    """Construit le fil de messages pour le tour courant.

    Historique : les ``max_detailed_steps`` derniers tours en détail, les plus
    anciens résumés en une ligne (fenêtre glissante — gestion du contexte).
    """
    messages: list[Message] = [
        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"TÂCHE :\n{session.task}"},
    ]

    steps = session.steps
    old, recent = steps[:-max_detailed_steps], steps[-max_detailed_steps:]

    if old:
        summary = "; ".join(
            f"#{s.index} {s.action.tool if s.action else 'réflexion'}"
            f"{'✓' if (s.observation and s.observation.ok) else '✗'}"
            for s in old
        )
        messages.append({
            "role": "user",
            "content": f"[Historique résumé des étapes précédentes : {summary}]",
        })

    for s in recent:
        # Ce que l'agent a décidé (assistant), puis l'observation (user).
        action_json = json.dumps(
            {
                "thought": s.thought,
                "action": (
                    {"tool": s.action.tool, "args": s.action.args} if s.action else None
                ),
                "done": s.done,
            },
            ensure_ascii=False,
        )
        messages.append({"role": "assistant", "content": action_json})
        if s.observation is not None:
            messages.append({
                "role": "user",
                "content": f"OBSERVATION #{s.index} :\n{s.observation.as_text()}",
            })

    messages.append({
        "role": "user",
        "content": "Prochaine étape ? Réponds avec un unique objet JSON.",
    })
    return messages


# --------------------------------------------------------------------------
# Parsing tolérant de la sortie LLM
# --------------------------------------------------------------------------

def parse_agent_output(raw: str) -> dict | None:
    """Extrait l'objet JSON de la réponse LLM, de façon tolérante.

    Gère : JSON pur, JSON dans un bloc ```json ... ```, ou JSON précédé/suivi
    de texte. Retourne None si rien d'exploitable.
    """
    if not raw or not raw.strip():
        return None

    # 1) Bloc ```json ... ``` ou ``` ... ```
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    candidate = fence.group(1) if fence else None

    # 2) Sinon, le premier { ... } équilibré (heuristique : du 1er { au dernier }).
    if candidate is None:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end > start:
            candidate = raw[start : end + 1]

    if candidate is None:
        return None

    try:
        obj = json.loads(candidate)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        return None
