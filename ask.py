"""Tuteur Python : pipeline RAG complet (recherche + génération).

Assemble les briques :
  1. Encodage de la question.
  2. Récupération des chunks les plus proches dans ChromaDB.
  3. Construction d'un prompt avec ces extraits comme contexte.
  4. Génération via Ollama local (deepseek-r1:8b par défaut).
  5. Affichage de la réponse + citations des sources.

Tout est local : zéro dépendance externe à l'exécution.

Usage :
    python ask.py "Comment fonctionne un décorateur ?"
    python ask.py "Explique asyncio.gather" --k 7
    python ask.py "Différence list vs tuple" --show-thinking
"""
from __future__ import annotations

import argparse
import json
import sys
import textwrap
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


SYSTEM_PROMPT = """Tu es un tuteur Python expert. Tu réponds toujours en français,
clairement et avec rigueur pédagogique.

Tu disposes d'extraits de la documentation officielle Python 3.14 pour répondre.
Règles strictes :
  - Base ta réponse uniquement sur les extraits fournis.
  - Si les extraits ne contiennent pas la réponse, dis-le franchement.
  - Cite la source quand tu fais une affirmation factuelle.
  - Inclus des exemples de code quand c'est pertinent.
  - Si la question est mal posée, reformule-la avant de répondre.
"""


def retrieve_context(query: str, k: int, embed_model: SentenceTransformer):
    """Récupère les k chunks les plus proches dans ChromaDB."""
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except (ValueError, chromadb.errors.NotFoundError):
        raise SystemExit(
            f"Collection '{COLLECTION_NAME}' introuvable. "
            f"Lance d'abord :  python build_index.py"
        )

    embedding = embed_model.encode(
        [query], normalize_embeddings=True, convert_to_numpy=True
    ).tolist()
    results = collection.query(query_embeddings=embedding, n_results=k)

    return [
        {
            "text": doc,
            "source": meta["source"],
            "section": meta.get("section") or "(préambule)",
            "score": 1 - dist,
        }
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]


def build_prompt(question: str, chunks: list[dict]) -> str:
    """Assemble le prompt final avec les passages numérotés en contexte."""
    context_blocks = []
    for i, c in enumerate(chunks, 1):
        context_blocks.append(
            f"[Source {i} — {c['source']} §{c['section']}]\n{c['text']}"
        )
    context = "\n\n---\n\n".join(context_blocks)

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"===== EXTRAITS DE LA DOCUMENTATION =====\n\n"
        f"{context}\n\n"
        f"===== QUESTION =====\n\n"
        f"{question}\n\n"
        f"Réponds en t'appuyant sur les extraits ci-dessus. "
        f"Termine ta réponse par une section « Sources » listant les "
        f"numéros de sources utilisés."
    )


def call_ollama(prompt: str, model: str, stream: bool = True) -> str:
    """Appelle l'API locale d'Ollama. Streaming pour voir la réponse en direct."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
        "options": {"temperature": 0.2},  # bas : on veut de la précision factuelle
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        OLLAMA_URL, data=data, headers={"Content-Type": "application/json"}
    )

    try:
        response = urllib.request.urlopen(request, timeout=300)
    except urllib.error.URLError as exc:
        raise SystemExit(
            f"Impossible de contacter Ollama sur {OLLAMA_URL}.\n"
            f"Vérifie qu'Ollama tourne (lance simplement 'ollama serve' "
            f"dans un autre terminal, ou démarre l'application Ollama).\n"
            f"Erreur : {exc}"
        )

    full_text = []
    for line in response:
        if not line.strip():
            continue
        chunk = json.loads(line)
        piece = chunk.get("response", "")
        full_text.append(piece)
        # Affichage en direct (streaming).
        sys.stdout.write(piece)
        sys.stdout.flush()
        if chunk.get("done"):
            break
    print()  # saut de ligne final
    return "".join(full_text)


def strip_thinking(text: str) -> str:
    """deepseek-r1 émet ses traces de raisonnement entre <think>...</think>.

    On les retire pour ne garder que la réponse finale, sauf si on veut les voir.
    """
    import re
    return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL).strip()


def print_sources(chunks: list[dict]) -> None:
    print("\n" + "=" * 60)
    print("Sources consultées :")
    for i, c in enumerate(chunks, 1):
        print(f"  [{i}] {c['source']}  §{c['section']}  (score={c['score']:.3f})")


def ask(question: str, k: int, show_thinking: bool, model: str) -> None:
    print(f"\nQuestion : {question}\n")
    print(f"Recherche des {k} passages les plus pertinents...")

    embed_model = SentenceTransformer(EMBEDDING_MODEL)
    chunks = retrieve_context(question, k, embed_model)

    print(f"Trouvé {len(chunks)} chunks. Génération par {model}...\n")
    print("-" * 60)

    prompt = build_prompt(question, chunks)
    full_response = call_ollama(prompt, model)

    if not show_thinking:
        cleaned = strip_thinking(full_response)
        if cleaned != full_response.strip():
            print("\n" + "-" * 60)
            print("(Raisonnement interne masqué — utilise --show-thinking pour le voir)")

    print_sources(chunks)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("question", help="La question à poser au tuteur Python.")
    parser.add_argument("--k", type=int, default=TOP_K,
                        help=f"Nombre de chunks de contexte (défaut : {TOP_K}).")
    parser.add_argument("--model", default=OLLAMA_MODEL,
                        help=f"Modèle Ollama à utiliser (défaut : {OLLAMA_MODEL}).")
    parser.add_argument("--show-thinking", action="store_true",
                        help="Afficher le raisonnement interne du modèle.")
    args = parser.parse_args()
    ask(args.question, k=args.k, show_thinking=args.show_thinking, model=args.model)


if __name__ == "__main__":
    main()
