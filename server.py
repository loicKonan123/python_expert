"""Mini-serveur HTTP pour le tuteur Python RAG.

Endpoints :
  GET  /              -> sert l'interface web (web/index.html)
  POST /ask           -> reçoit {"question": "..."} et streame la réponse
                          en Server-Sent Events (SSE).

Tout reste local : le serveur tourne sur http://localhost:8000 et appelle
Ollama sur http://localhost:11434. Aucun trafic sortant.

Lancement :
    python server.py
    -> Ouvrir http://localhost:8000 dans le navigateur.
"""
from __future__ import annotations

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Iterator
import urllib.error
import urllib.request

import chromadb
from sentence_transformers import SentenceTransformer

from config import (
    CHROMA_DIR,
    COLLECTION_NAME,
    EMBEDDING_MODEL,
    OLLAMA_MODEL,
    OLLAMA_URL,
    TOP_K,
)

PORT = 8000
WEB_DIR = Path(__file__).parent / "web"

SYSTEM_PROMPT = """You are an expert Python tutor. Answer in French, clearly
and with pedagogical rigor.

You have excerpts from the official Python 3.14 documentation to answer.
Strict rules:
  - Base your answer ONLY on the provided excerpts.
  - If the excerpts do not contain the answer, say so frankly.
  - Cite the source number when you make a factual claim.
  - Include code examples when relevant.
"""

# Singletons chargés une fois au démarrage du serveur — coût initial ~2 sec,
# puis chaque requête est rapide.
print("Chargement du modèle d'embedding...")
EMBED_MODEL = SentenceTransformer(EMBEDDING_MODEL)
print("Connexion à ChromaDB...")
_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
COLLECTION = _client.get_collection(COLLECTION_NAME)
print(f"Collection chargée : {COLLECTION.count():,} chunks indexés.")


def retrieve(query: str, k: int) -> list[dict]:
    embedding = EMBED_MODEL.encode(
        [query], normalize_embeddings=True, convert_to_numpy=True
    ).tolist()
    results = COLLECTION.query(query_embeddings=embedding, n_results=k)
    return [
        {
            "text": doc,
            "source": meta["source"],
            "section": meta.get("section") or "(préambule)",
            "score": round(1 - dist, 3),
        }
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n---\n\n".join(
        f"[Source {i} — {c['source']} §{c['section']}]\n{c['text']}"
        for i, c in enumerate(chunks, 1)
    )
    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"===== DOCUMENTATION EXCERPTS =====\n\n{context}\n\n"
        f"===== QUESTION =====\n\n{question}\n\n"
        f"Answer in French, citing source numbers."
    )


def stream_ollama(prompt: str) -> Iterator[str]:
    """Yield les morceaux de texte renvoyés par Ollama au fur et à mesure."""
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {"temperature": 0.2},
    }).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"}
    )
    try:
        response = urllib.request.urlopen(request, timeout=300)
    except urllib.error.URLError as exc:
        yield f"\n\n[Erreur Ollama : {exc}]"
        return

    for line in response:
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        piece = data.get("response", "")
        if piece:
            yield piece
        if data.get("done"):
            break


def sse_event(event: str, data: dict | str) -> bytes:
    """Encode un événement Server-Sent Events."""
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    # Échappe les sauts de ligne car SSE utilise \n comme séparateur de champs.
    payload = payload.replace("\n", "\\n")
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    # Silencieux — on ne veut pas spammer la console à chaque ping.
    def log_message(self, format, *args):
        pass

    def _send_file(self, path: Path, content_type: str) -> None:
        try:
            data = path.read_bytes()
        except FileNotFoundError:
            self.send_error(404, "Not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if self.path == "/" or self.path == "/index.html":
            self._send_file(WEB_DIR / "index.html", "text/html; charset=utf-8")
        else:
            self.send_error(404, "Not found")

    def do_POST(self) -> None:
        if self.path != "/ask":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            body = json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        question = (body.get("question") or "").strip()
        k = int(body.get("k", TOP_K))
        if not question:
            self.send_error(400, "Empty question")
            return

        # En-têtes SSE.
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        try:
            chunks = retrieve(question, k)
            self.wfile.write(sse_event("sources", chunks))
            self.wfile.flush()

            prompt = build_prompt(question, chunks)
            buffer = ""
            in_thinking = False

            for piece in stream_ollama(prompt):
                buffer += piece

                # deepseek-r1 émet <think>...</think> pour son raisonnement.
                # On les filtre côté serveur pour ne streamer que la réponse.
                while True:
                    if not in_thinking:
                        open_idx = buffer.find("<think>")
                        if open_idx == -1:
                            if buffer:
                                self.wfile.write(sse_event("token", buffer))
                                self.wfile.flush()
                                buffer = ""
                            break
                        # Envoie ce qui précède le <think>, garde le reste.
                        if open_idx > 0:
                            self.wfile.write(sse_event("token", buffer[:open_idx]))
                            self.wfile.flush()
                        buffer = buffer[open_idx + len("<think>"):]
                        in_thinking = True
                    else:
                        close_idx = buffer.find("</think>")
                        if close_idx == -1:
                            buffer = ""
                            break
                        buffer = buffer[close_idx + len("</think>"):]
                        in_thinking = False

            self.wfile.write(sse_event("done", ""))
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            # Le client a fermé l'onglet — pas une erreur.
            return


def main() -> None:
    if not (WEB_DIR / "index.html").exists():
        raise SystemExit(f"Fichier introuvable : {WEB_DIR / 'index.html'}")

    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"\nServeur prêt sur http://localhost:{PORT}")
    print("Ctrl+C pour arrêter.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")
        server.server_close()


if __name__ == "__main__":
    main()
