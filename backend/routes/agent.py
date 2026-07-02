"""Endpoint POST /api/agent — exécute l'agent et streame ses étapes en SSE.

⚠️ SÉCURITÉ : l'agent exécute des COMMANDES ARBITRAIRES via LocalExecutor
(non isolé). Acceptable en usage LOCAL SOLO uniquement. AVANT tout déploiement
public/multi-utilisateur, il FAUT :
  - remplacer LocalExecutor par DockerExecutor (conteneur isolé, réseau coupé),
  - et/ou gater cette route derrière une authentification + un flag serveur.

Flux SSE :
  - event: start   data: {session_id, task}
  - event: step    data: {index, thought, tool, args, ok, observation, done}
  - event: done    data: {state, success, summary, files}
  - event: error   data: "message"
  - event: end     data: ""
"""
from __future__ import annotations

import json
import logging
import queue
import threading
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..agent.executor import LocalExecutor
from ..agent.loop import run_agent
from ..agent.state import AgentSession, Step
from ..agent.workspace import Workspace


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["agent"])


class AgentRequest(BaseModel):
    task: str = Field(..., min_length=1, max_length=4000)
    max_iterations: int = Field(default=18, ge=1, le=30)


def _sse(event: str, data) -> bytes:
    payload = json.dumps(data, ensure_ascii=False) if isinstance(data, (dict, list)) else str(data)
    payload = payload.replace("\n", "\\n")
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


def _step_to_dict(s: Step) -> dict:
    return {
        "index": s.index,
        "thought": s.thought,
        "tool": s.action.tool if s.action else "finish",
        "args": s.action.args if s.action else {},
        "ok": bool(s.observation.ok) if s.observation else True,
        "observation": s.observation.as_text() if s.observation else "",
        "done": s.done,
    }


@router.post("/agent")
def agent(req: AgentRequest, request: Request) -> StreamingResponse:
    llm = request.app.state.llm
    rag = getattr(request.app.state, "rag", None)

    session_id = "agent-" + uuid.uuid4().hex[:12]
    ws = Workspace(session_id)
    ex = LocalExecutor(ws)
    session = AgentSession(id=session_id, task=req.task, max_iterations=req.max_iterations)

    logger.warning(
        "[AGENT] session %s démarrée (LocalExecutor NON isolé — usage local uniquement)",
        session_id,
    )

    # Queue thread-safe : le worker pousse les étapes, le générateur SSE les tire.
    events: "queue.Queue[tuple[str | None, object]]" = queue.Queue()

    def on_step(step: Step) -> None:
        events.put(("step", _step_to_dict(step)))

    def worker() -> None:
        try:
            run_agent(session, llm.complete, ws, ex, rag=rag, on_step=on_step)
            events.put((
                "done",
                {
                    "state": session.state,
                    "success": session.success,
                    "summary": session.summary,
                    "files": list(ws.list_files().files),
                },
            ))
        except Exception as exc:  # noqa: BLE001
            logger.exception("[AGENT] worker crash : %s", exc)
            events.put(("error", str(exc)))
        finally:
            events.put((None, None))  # sentinelle de fin

    def generate():
        yield _sse("start", {"session_id": session_id, "task": req.task})
        threading.Thread(target=worker, daemon=True).start()
        while True:
            kind, data = events.get()
            if kind is None:
                break
            yield _sse(kind, data)
        yield _sse("end", "")

    return StreamingResponse(generate(), media_type="text/event-stream")
