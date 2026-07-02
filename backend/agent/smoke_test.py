"""Test réel de l'agent avec le vrai LLM (DeepSeek/Ollama selon settings).

Usage : python -m backend.agent.smoke_test
Consomme quelques appels API. Tâche : écrire median() + tests pytest et les
faire passer, en autonomie.
"""
from __future__ import annotations

import logging

from ..llm_providers import get_provider
from .executor import LocalExecutor
from .loop import run_agent
from .state import AgentSession
from .workspace import Workspace


TASK = (
    "Écris un fichier median.py contenant une fonction median(nums) qui "
    "retourne la médiane d'une liste de nombres (gère liste paire, impaire, "
    "et lève ValueError si la liste est vide). Écris ensuite test_median.py "
    "avec pytest couvrant ces 3 cas. Lance les tests et corrige jusqu'à ce "
    "qu'ils passent tous."
)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    provider = get_provider()
    ws = Workspace("smoke-median")
    ex = LocalExecutor(ws)
    session = AgentSession(id="smoke-median", task=TASK, max_iterations=12)

    print("=" * 70)
    print("TÂCHE :", TASK)
    print("=" * 70)

    def on_step(step) -> None:
        tool = step.action.tool if step.action else "finish"
        print(f"\n── Étape #{step.index} [{tool}] ──")
        if step.thought:
            print("  💭", step.thought[:200])
        if step.action:
            args_preview = {
                k: (v[:80] + "…" if isinstance(v, str) and len(v) > 80 else v)
                for k, v in step.action.args.items()
            }
            print("  ⚙️ ", args_preview)
        if step.observation:
            print("  👁 ", step.observation.as_text().replace("\n", "\n     ")[:400])

    run_agent(session, provider.complete, ws, ex, rag=None, on_step=on_step)

    print("\n" + "=" * 70)
    print(f"RÉSULTAT : state={session.state} | success={session.success} "
          f"| {len(session.steps)} étapes")
    print("SUMMARY :", session.summary)
    print("FICHIERS :", ws.list_files().files)
    print("=" * 70)
    # On garde le workspace pour inspection (pas de cleanup ici).


if __name__ == "__main__":
    main()
