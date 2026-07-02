"""Tools de l'agent : dispatch d'une ToolCall vers workspace / executor / RAG.

Chaque tool renvoie une ``Observation`` (texte lisible + statut) que la boucle
ré-injecte au LLM. La description ci-dessous (TOOLS_SPEC) est intégrée au prompt
système pour que le LLM sache quels tools existent et leur format.
"""
from __future__ import annotations

import logging

from .executor import Executor
from .state import Observation, ToolCall
from .workspace import Workspace


logger = logging.getLogger(__name__)


TOOLS_SPEC = """\
Tu disposes des OUTILS suivants. À chaque tour, tu choisis UN outil.

- write_file(path, content) : écrit/écrase un fichier dans le workspace.
- read_file(path) : lit le contenu d'un fichier.
- list_files() : liste tous les fichiers du workspace.
- run_command(command) : exécute une commande shell dans le workspace
  (ex: "python -m pytest -q", "python main.py"). Tu vois stdout/stderr/exit.
- search_docs(query, corpus) : cherche dans la doc officielle indexée
  (corpus optionnel : python, fastapi, pytest, sqlalchemy, ...). À utiliser
  AVANT d'écrire du code sur une API dont tu n'es pas certain.
- finish(summary) : déclare la tâche terminée. Déclenche une vérification.
"""


def dispatch(
    call: ToolCall,
    workspace: Workspace,
    executor: Executor,
    rag=None,
    default_timeout: float = 30.0,
) -> Observation:
    """Exécute une ToolCall et renvoie l'observation correspondante."""
    tool = (call.tool or "").strip()
    args = call.args or {}

    try:
        if tool == "write_file":
            r = workspace.write_file(str(args.get("path", "")), str(args.get("content", "")))
            if r.ok:
                return Observation(True, f"Fichier écrit : {r.path}")
            return Observation(False, error=r.error)

        if tool == "read_file":
            r = workspace.read_file(str(args.get("path", "")))
            if r.ok:
                return Observation(True, f"# {r.path}\n{r.content}")
            return Observation(False, error=r.error)

        if tool == "list_files":
            r = workspace.list_files()
            if r.ok:
                listing = "\n".join(r.files) if r.files else "(workspace vide)"
                return Observation(True, listing)
            return Observation(False, error=r.error)

        if tool == "run_command":
            cmd = str(args.get("command", "")).strip()
            if not cmd:
                return Observation(False, error="commande manquante")
            timeout = float(args.get("timeout_s", default_timeout))
            res = executor.run(cmd, timeout_s=min(timeout, 120.0))
            parts = [f"$ {cmd}", f"exit_code={res.exit_code} ({res.elapsed_ms}ms)"]
            if res.stdout:
                parts.append("--- stdout ---\n" + res.stdout)
            if res.stderr:
                parts.append("--- stderr ---\n" + res.stderr)
            if res.timeout:
                parts.append("[TIMEOUT]")
            return Observation(res.ok, "\n".join(parts))

        if tool == "search_docs":
            if rag is None:
                return Observation(False, error="RAG indisponible dans cette session")
            query = str(args.get("query", "")).strip()
            if not query:
                return Observation(False, error="query manquante")
            corpus = args.get("corpus")
            corpora = [corpus] if isinstance(corpus, str) and corpus else None
            chunks = rag.retrieve(query, k=3, corpora=corpora)
            if not chunks:
                return Observation(True, "(aucun extrait trouvé dans la doc)")
            # Texte pour le LLM : chaque extrait préfixé de sa RÉFÉRENCE, pour
            # qu'il s'appuie dessus et puisse la citer dans ses commentaires.
            out: list[str] = []
            sources: list[dict] = []
            for i, c in enumerate(chunks, 1):
                corpus_name = getattr(c, "corpus", "?")
                src = getattr(c, "source", "?")
                section = getattr(c, "section", "")
                score = getattr(c, "score", 0.0)
                text = getattr(c, "text", "")[:700]
                ref = f"[{i}] {corpus_name} · {src}" + (f" §{section}" if section else "")
                out.append(f"{ref} (score {score:.2f})\n{text}")
                sources.append({
                    "index": i,
                    "corpus": corpus_name,
                    "source": src,
                    "section": section,
                    "score": round(float(score), 3),
                })
            return Observation(True, "\n\n".join(out), sources=sources)

        return Observation(False, error=f"outil inconnu : '{tool}'")

    except Exception as exc:  # garde-fou : un tool ne doit jamais crasher la boucle
        logger.exception("[AGENT-TOOL] '%s' a levé : %s", tool, exc)
        return Observation(False, error=f"exception dans '{tool}' : {exc}")
