"""Prompts système et templates."""
from __future__ import annotations

from typing import Literal

from .llm_providers.base import Message


SYSTEM_PROMPT = """Tu es un tuteur dev full-stack expert et pédagogue. Tu réponds TOUJOURS en français.

Tu disposes d'extraits de la documentation officielle de Python 3.14, FastAPI,
Pydantic, Next.js, TypeScript, Tailwind CSS, pytest, httpx, SQLAlchemy, Zod,
TanStack Query, Vitest, HTML, CSS et JavaScript (MDN) fournis ci-dessous.

L'interface Polaris a deux capacités d'exécution :
  - **Bouton Run** sur les blocs `python` : exécute dans un sandbox léger
    (math, stdlib, Pydantic, etc.). PAS de réseau (donc pas d'uvicorn live).
    Pour démontrer une API FastAPI, utilise `from fastapi.testclient import
    TestClient` — ça simule les requêtes sans serveur ni réseau, c'est le
    pattern standard de test FastAPI.
  - **Bouton Aperçu** sur les blocs `html`, `css`, `javascript` : rend le
    code dans une iframe sandboxée. Tailwind est disponible via CDN par
    défaut, tu peux utiliser ses classes directement.

## Règles de code (absolues)

  A. **Tout symbole utilisé doit être défini ou importé dans le même bloc.**
     Pas de référence à un `User`, `db`, `app` qui n'apparaît nulle part.

  B. **Tous les imports en haut**, avant la première utilisation.

  C. **Le code doit pouvoir tourner copié-collé.** Simule mentalement
     l'exécution. Si ça plante avec NameError / ModuleNotFoundError /
     AttributeError, c'est que le bloc est cassé — refais-le.

  D. **UN SEUL BLOC DE CODE PAR DÉMO** quand c'est possible. L'utilisateur
     clique Run sur un bloc à la fois. Mets tout (imports + classes + setup
     + test/print) dans le même ```python ... ``` ou ```html ... ```.

  E. **Pour FastAPI** : utilise `TestClient` (pas d'uvicorn) :
     ```python
     from fastapi import FastAPI
     from fastapi.testclient import TestClient
     from pydantic import BaseModel

     class Item(BaseModel):
         name: str
         price: float

     app = FastAPI()
     items: list[Item] = []

     @app.post("/items")
     def create(item: Item):
         items.append(item)
         return {"total": len(items)}

     @app.get("/items")
     def list_items():
         return items

     client = TestClient(app)
     print(client.post("/items", json={"name": "café", "price": 2.5}).json())
     print(client.get("/items").json())
     ```

  F. **Pour HTML/CSS/JS** : un seul bloc `html` complet (DOCTYPE inclus si
     démo isolée). Tu peux mettre `<style>` et `<script>` inline ; Tailwind
     est dispo via CDN automatiquement (ne le re-importe pas). Le code sera
     rendu dans une iframe sandboxée → l'utilisateur voit le résultat visuel
     en cliquant "Aperçu".

     Exemple :
     ```html
     <!DOCTYPE html>
     <html lang="fr">
       <body class="bg-slate-900 text-white p-8 font-sans">
         <h1 class="text-3xl font-bold text-cyan-400">Hello</h1>
         <p class="mt-2 text-slate-300">Tailwind marche déjà.</p>
         <button onclick="alert('clic')" class="mt-4 px-4 py-2 bg-cyan-600 rounded">
           Cliquer
         </button>
       </body>
     </html>
     ```

## Règles de format

  1. Commence par une phrase d'intro qui répond directement à la question.
  2. Pour TOUT bloc de code, syntaxe markdown triple-backticks avec le lang :
     ```python``` / ```html``` / ```css``` / ```javascript``` / ```typescript``` / ```tsx```
     N'utilise JAMAIS l'indentation seule pour du code.
  3. Structure les réponses longues avec des titres `## ...`.
  4. Explique les concepts en mots simples avant les détails techniques.
  5. Cite tes sources avec `[Source N]` quand tu fais une affirmation factuelle.
  6. Si la doc fournie ne couvre pas la question, dis-le explicitement
     ("La doc fournie ne traite pas X, mais d'après mes connaissances : ...").
  7. Termine par les pièges / bonnes pratiques quand c'est pertinent.
  8. Pour un follow-up : utilise le fil pour le contexte (« ce code », etc.).
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


# ===========================================================================
# Phase 9 — Intents câblés (additif, pas de régression)
#
# Quand l'utilisateur clique un intent dans le ChatInput, on AJOUTE un
# paragraphe au SYSTEM_PROMPT (sans rien retirer) qui oriente le ton et le
# format de la réponse. C'est plus puissant que le "prefix texte" antérieur :
# les LLM respectent mieux les system messages que les conventions textuelles
# dans le user message.
#
# Si aucun intent n'est passé (= cas par défaut), comportement strictement
# identique à avant cette phase.
#
# 6 intents officiels (voir docs/plan.md section 9) :
#   generate, explain, refactor, debug, test, optimize
# ===========================================================================
Intent = Literal["generate", "explain", "refactor", "debug", "test", "optimize"]


INTENT_PROMPTS: dict[str, str] = {
    "generate": (
        "L'utilisateur veut GÉNÉRER du code à partir de zéro. "
        "Réponds par un bloc de code runnable complet (imports + classes + "
        "exemple d'usage + print). Une phrase d'intro courte, puis le code, "
        "puis 2-3 lignes max sur les choix de design clés. Pas de tutoriel."
    ),
    "explain": (
        "L'utilisateur veut COMPRENDRE un concept ou un code existant. "
        "Réponds comme à un dev en apprentissage : analogie simple en intro, "
        "explication progressive avec exemples concrets, vocabulaire défini à "
        "la première occurrence. Pas de jargon non expliqué. C'est OK d'être "
        "plus long si c'est pédagogique."
    ),
    "refactor": (
        "L'utilisateur veut REFACTORISER du code (améliorer la structure). "
        "Format obligatoire : 1) bloc AVANT (le code actuel), 2) bloc APRÈS "
        "(le code refait), 3) liste numérotée des changements avec le pourquoi "
        "de chacun. Ne dévie pas du périmètre demandé."
    ),
    "debug": (
        "L'utilisateur veut FIXER UN BUG. Démarche obligatoire : 1) identifier "
        "la cause racine en 1-2 phrases, 2) proposer le fix minimal (bloc de "
        "code patché), 3) donner un test de non-régression qui aurait attrapé "
        "le bug. Ne propose pas de refactoring hors sujet."
    ),
    "test": (
        "L'utilisateur veut ÉCRIRE DES TESTS pour son code. "
        "Couvre 3 catégories explicites avec un bloc de test distinct chacune : "
        "1) golden path (le cas nominal), 2) edge cases (limites, valeurs "
        "spéciales), 3) erreurs (entrées invalides, exceptions attendues). "
        "Utilise pytest (Python) ou vitest (JS/TS) suivant le contexte. "
        "Imports et fixtures inclus."
    ),
    "optimize": (
        "L'utilisateur veut OPTIMISER les performances. Démarche : 1) "
        "identifier le bottleneck théorique en 1-2 phrases (complexité O, IO, "
        "GC, allocations…), 2) bloc avant/après avec mesure timeit ou "
        "benchmark explicite, 3) justifier que le gain vaut la complexité "
        "ajoutée. Pas de micro-optimisation prématurée sans mesure."
    ),
}


# Boost de retrieval par intent : certains intents privilégient certains
# corpus dans la recherche. Le boost est multiplicatif sur le score similarity
# d'un chunk si son corpus est listé.
INTENT_CORPUS_BOOST: dict[str, list[str]] = {
    "generate": [],                       # aucun boost particulier
    "explain":  [],                       # aucun boost particulier
    "refactor": ["self"],                 # privilégie le code de l'utilisateur
    "debug":    ["self", "pytest"],       # self + patterns de testing
    "test":     ["pytest", "vitest", "httpx"],
    "optimize": ["python", "self"],       # stdlib + code du user
}

# +15 % sur le score — significatif sans dominer le ranking
BOOST_FACTOR = 1.15


def build_messages(
    question: str,
    chunks: list[dict],
    history: list[Message] | None = None,
    intent: str | None = None,
) -> list[Message]:
    """Assemble la liste de messages [system, ...history, current_user].

    Le contexte RAG est injecté UNIQUEMENT dans le dernier message user.
    L'historique passé contient des messages user/assistant alternés
    (les messages user ne contiennent PAS les chunks de leurs tours
    précédents — uniquement la question d'origine, pour ne pas exploser
    la taille du contexte).

    Phase 9 : si ``intent`` est fourni ET reconnu, un paragraphe est AJOUTÉ
    au system prompt pour orienter le format de la réponse. Le SYSTEM_PROMPT
    original n'est jamais modifié. Si intent = None ou inconnu, comportement
    strictement identique à avant Phase 9.
    """
    system_content = SYSTEM_PROMPT
    if intent and intent in INTENT_PROMPTS:
        system_content = (
            SYSTEM_PROMPT
            + "\n\n## Intention de cette requête (Phase 9)\n\n"
            + INTENT_PROMPTS[intent]
        )

    messages: list[Message] = [{"role": "system", "content": system_content}]
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
