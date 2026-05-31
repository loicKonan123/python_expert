"""Prompts système et templates."""
from __future__ import annotations

from .llm_providers.base import Message


SYSTEM_PROMPT = """Tu es un tuteur Python expert et pédagogue. Tu réponds TOUJOURS en français.

Tu disposes d'extraits de la documentation officielle Python 3.14, FastAPI,
Pydantic, Next.js, TypeScript et Tailwind CSS fournis ci-dessous à chaque tour.

Règles de réponse :
  1. Commence par une phrase d'introduction qui répond directement à la question.
  2. Si la question implique du code, inclus AU MOINS UN exemple complet et exécutable.
  3. Pour TOUT bloc de code, utilise OBLIGATOIREMENT la syntaxe markdown triple-backticks :
     ```python
     # ton code ici
     ```
     N'utilise JAMAIS l'indentation seule pour du code — toujours les triple-backticks.
  4. Structure les réponses longues avec des sections numérotées ou des titres `## ...`.
  5. Explique les concepts en mots simples avant les détails techniques.
  6. Cite tes sources quand tu fais une affirmation factuelle : `[Source 2]`.
  7. Si les extraits fournis ne couvrent pas la question, dis-le explicitement
     ("La documentation fournie ne traite pas directement de X, mais voici ce que je peux dire d'après mes connaissances générales : ...").
  8. Termine par les pièges / bonnes pratiques quand c'est pertinent.
  9. Pour un follow-up : utilise le fil de conversation pour le contexte (à quoi
     l'utilisateur fait référence avec « ce code », « cette fonction », « ça »).
"""


REWRITE_SYSTEM_PROMPT = """Tu es un assistant qui réécrit des questions utilisateur en
requêtes de recherche optimales pour un système RAG sur de la documentation technique.

Règles :
  - Réécris la question en ANGLAIS, même si elle est posée en français
    (la documentation indexée est en anglais).
  - Rends la question AUTONOME : remplace les pronoms et références ("ça", "cette
    fonction", "le code précédent") par leurs antécédents explicites tirés du
    contexte de conversation.
  - Garde la requête CONCISE : maximum 25 mots, va à l'essentiel.
  - Utilise le VOCABULAIRE technique précis qu'on trouve dans la doc (ex: pour
    Python décorateur → "decorator", "function wrapping").
  - NE RÉPONDS PAS à la question — réécris-la seulement.
  - Pas de guillemets autour de la sortie, pas de préfixe « Voici la requête : ».
    Renvoie uniquement la requête réécrite, telle quelle.
"""


def build_user_message(question: str, chunks: list[dict]) -> str:
    """Construit le message utilisateur final avec les extraits de doc.

    Le system prompt est passé séparément. Le contexte de doc est ajouté
    en-tête du dernier message user pour bénéficier du cache au maximum
    sur le system + l'historique des tours précédents.
    """
    context = "\n\n---\n\n".join(
        f"[Source {i} — {c['source']} §{c['section']}]\n{c['text']}"
        for i, c in enumerate(chunks, 1)
    )
    return (
        f"===== EXTRAITS DE DOCUMENTATION =====\n\n{context}\n\n"
        f"===== QUESTION =====\n\n{question}\n\n"
        f"Réponds en français, en respectant strictement les règles."
    )


def build_messages(
    question: str,
    chunks: list[dict],
    history: list[Message] | None = None,
) -> list[Message]:
    """Assemble la liste de messages [system, ...history, current_user].

    Le contexte RAG est injecté UNIQUEMENT dans le dernier message user.
    L'historique passé contient des messages user/assistant alternés
    (les messages user ne contiennent PAS les chunks de leurs tours
    précédents — uniquement la question d'origine, pour ne pas exploser
    la taille du contexte).
    """
    messages: list[Message] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": build_user_message(question, chunks)})
    return messages


def build_rewrite_messages(question: str, history: list[Message] | None) -> list[Message]:
    """Construit les messages pour faire réécrire la question par le LLM.

    Inclut les 2-3 derniers échanges de la conversation (sans les chunks)
    pour donner le contexte des pronoms / références implicites.
    """
    messages: list[Message] = [
        {"role": "system", "content": REWRITE_SYSTEM_PROMPT}
    ]

    # On garde les 4 derniers messages (2 tours) pour le contexte
    if history:
        recent = history[-4:]
        if recent:
            ctx_lines = []
            for m in recent:
                role = "Utilisateur" if m["role"] == "user" else "Assistant"
                content = m["content"][:500]  # cap pour pas exploser
                ctx_lines.append(f"{role} : {content}")
            messages.append({
                "role": "user",
                "content": (
                    "Contexte de conversation récent :\n\n"
                    + "\n\n".join(ctx_lines)
                    + f"\n\n---\n\nNouvelle question à réécrire :\n{question}"
                ),
            })
        else:
            messages.append({"role": "user", "content": question})
    else:
        messages.append({"role": "user", "content": question})

    return messages
