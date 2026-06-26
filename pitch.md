# Polaris — Tuteur full-stack par RAG sur documentation officielle

> *Projet personnel · full-stack · IA appliquée · 2025–2026*
>
> Démo : `python -m backend.main` + `cd frontend && npm run dev`
> Repo : [github.com/loicKonan123/python_expert](https://github.com/loicKonan123/python_expert)

---

## En une phrase

**Polaris est un assistant pédagogique qui répond aux questions techniques en s'appuyant sur la documentation officielle (Python, FastAPI, .NET, React, Tailwind, MDN…) au lieu d'inventer comme un LLM brut, avec exécution de code en sandbox (Python + C#) directement dans le chat.**

---

## Pourquoi ça existe

ChatGPT et Copilot hallucinent sur les API récentes. Stack Overflow vieillit. Les docs officielles sont la vérité — mais elles sont longues, en anglais, et difficiles à explorer pour un apprenant. **Polaris ferme cette boucle** : RAG (Retrieval Augmented Generation) sur 19 corpus de doc officielle, sources citables, sandbox d'exécution intégré, curriculum structuré de 429 concepts.

---

## Stack technique

| Couche | Choix | Justification |
|---|---|---|
| **Backend** | FastAPI + Pydantic Settings + asynccontextmanager lifespan | Type-safety, async natif, OpenAPI auto |
| **RAG** | ChromaDB + sentence-transformers/all-MiniLM-L6-v2 | 384 dim, CPU-friendly, suffisant pour 74k chunks |
| **LLM** | DeepSeek V4-Flash (cloud) + Ollama qwen2.5-coder (local) | Auto-routing selon complexité, $0.28/M output |
| **Sandbox Python** | subprocess `-I` + PEP 578 audit hook + temp dir + timeout | Défense en profondeur sans Docker |
| **Sandbox C#** | dotnet-script (Roslyn scripting) + env clean + préprocesseur AST-lite | Phase 15 — exécution C# top-level depuis le chat |
| **Frontend** | Next.js 16 (App Router) + Tailwind v4 + Monaco Editor | Streaming SSE, dark/light propre, code highlight |
| **Streaming** | Server-Sent Events natifs | Pas de WebSocket, simple et résilient |

---

## Les mécanismes que je peux expliquer en interview

### 1. RAG en pratique (pas juste un buzzword)

```
Question utilisateur (FR)
    ↓
LLM rewrite EN (optionnel, améliore retrieval)
    ↓
sentence-transformers → vecteur 384D de la question
    ↓
ChromaDB cosine search sur 74 080 chunks
    ↓
Top-K = 7 chunks récupérés (~3 300 tokens)
    ↓
LLM (DeepSeek/Ollama) avec system prompt strict :
   "appuie-toi sur ces extraits, cite tes sources, dis 'je ne sais pas' sinon"
    ↓
Streaming SSE token-by-token vers le frontend
    ↓
Bandeau Sources cliquables affiché sous la réponse
```

**Ce que ça démontre** : compréhension fine du compromis embeddings/LLM, du chunking (~400 tokens / overlap 50), de la latence (recherche ~50 ms, génération ~2-5 s).

### 2. Auto-routing du LLM

Le système choisit dynamiquement entre Ollama (local, gratuit, rapide pour cas simples) et DeepSeek (cloud, payant, meilleur pour cas complexes) selon des heuristiques sur la requête. Évite de payer pour un "Hello World".

### 3. Sandbox Python avec audit hook (PEP 578)

Au lieu d'un container Docker (lourd, complexe sur Windows), j'ai construit une défense en profondeur :
- Subprocess Python `-I` (isolated mode) avec env nettoyé (pas de `.env`, pas de credentials)
- Prelude injecté qui installe un **audit hook PEP 578** : bloque `subprocess.Popen`, `os.system`, accès filesystem hors sandbox dir, registre Windows
- Temp dir jetable, timeout strict, stdin DEVNULL, output tronqué
- Audit hook **permanent par design** (PEP 578 : non-removable)

**Ce que ça démontre** : sécurité applicative, connaissance de la stdlib Python avancée, choix d'archi argumenté (testé Docker → abandonné car overkill local).

### 4. Sandbox C# avec préprocesseur intelligent

`dotnet-script` (.csx) ne supporte pas les programmes C# classiques (`class Program { Main() }`). J'ai écrit un **préprocesseur en Python** qui :
- Détecte les programmes classiques → promeut le body de Main au top-level statements
- Préserve les classes sœurs (`class Livre {}` reste, seul `class Program` est strippé)
- Injecte `string[] args = new string[0]` quand `Main(string[] args)` exists
- Détecte ASP.NET Core → retourne un message d'aide propre (non runnable en .csx)
- Auto-injecte `#r "nuget: ..."` pour EF Core
- Filtre les warnings noise (CS7022, CS0219, CS0649, CS0168…) pour ne garder que les vraies erreurs

**Validé par 23/23 tests** : Hello, async/await, LINQ, multi-classes, records, pattern matching, generics, switch expression, decimal vs double, exceptions.

### 5. Intents câblés (orientation système prompt + retrieval)

6 intents cliquables (Generate / Explain / Refactor / Debug / Test / Optimize) qui :
- **Append** un paragraphe spécifique au system prompt (jamais ne modifient le prompt de base — 100 % additif)
- **Boost** certains corpus dans le retrieval (intent "test" → pytest +15 %, "debug" → corpus self-doc +15 %)
- Persistance localStorage côté frontend

Ce design "additif" est défendu contre la régression : tests d'intégration vérifient qu'`intent=None` produit exactement le même output qu'avant Phase 9.

### 6. Curriculum structuré (429 concepts × 18 technos)

Sidebar gauche organisée par techno → niveau → concept. Chaque concept a 3 champs :
- `fr` : titre français pédagogique
- `obj` : intitulé court à afficher
- `en` : question optimisée en anglais → cliquer envoie directement à `/api/ask`

Donne une **expérience d'apprentissage guidée** au-dessus du chat libre. Pédagogie + RAG = différenciation vs ChatGPT.

### 7. Design hierarchy en dark mode (`shell-deep`)

Petit détail UX qui montre que je pense au-delà du code : ChatInput, Sidebar et ConversationsMenu se confondaient avec les bulles bot (toutes en `glass-card-strong`). Solution : nouvelle classe `.shell-deep` scopée à `html[data-theme="dark"]` qui assombrit ces "shells" (fond solide #0c1428) en gardant le light mode strictement inchangé. **Hiérarchie visuelle : app < shell < bulles.**

---

## Chiffres qui parlent

| Métrique | Valeur |
|---|---|
| Corpus documentaires indexés | **19** (Python 3.14, FastAPI, Pydantic, SQLAlchemy, NumPy, Pandas, .NET, ASP.NET Core, EF Core, React, Next.js, Tailwind v4, MDN HTML/CSS/JS, Zod, TanStack Query, Vitest, pytest, httpx) |
| Chunks vectorisés | **74 080** |
| Concepts curriculum | **429** sur 42 niveaux |
| Niveaux pédagogiques | **42** (du Hello World à l'archi avancée) |
| Phases livrées | **15** (RAG → ecosystème → design → C#) |
| Latence retrieval | ~50 ms |
| Latence génération | 2-5 s (streaming) |
| Coût LLM / question | **~$0.0005** (avec cache hit DeepSeek) |
| Tests sandbox C# | **23/23 PASS** |

---

## Décisions d'archi que je peux défendre

- **Pas de Docker pour le sandbox** : analysé, expérimenté, abandonné. Audit hook PEP 578 + subprocess isolé est suffisant pour usage solo, plus simple, plus rapide, marche sur Windows sans WSL.
- **SSE plutôt que WebSocket** : streaming unidirectionnel, pas besoin du full-duplex, plus simple à débugger.
- **System prompt figé + paragraphe append pour intents** : zéro régression possible, intent=None reproduit le comportement pré-Phase 9 exactement.
- **Tailwind v4 avec @theme** : CSS-first, tokens couleur réutilisables côté composant.
- **MiniLM-L6 et pas un gros embedding** : 80 MB, CPU-only, suffisant pour ce corpus. Pas overkill.
- **Top-K=7 et pas 3 ou 20** : k=3 manque souvent le bon chunk (effet bordure), k=20 dilue le LLM.

---

## Ce que j'ai appris / ce que je peux discuter

- **Vector search** : embeddings, similarité cosine, chunking strategy, bord effect
- **Sandbox security** : PEP 578, isolation subprocess, env hygiene, défense en profondeur
- **LLM ops** : auto-routing, cost optimization, cache hit ratio, system prompt design
- **Streaming UX** : SSE, gestion d'annulation, parsing token-by-token côté client
- **Design system** : Tailwind v4 @theme, dark/light cohabitation, hiérarchie visuelle
- **Python moderne** : Pydantic Settings, lifespan asynccontextmanager, type hints stricts
- **TypeScript strict** : pas un `any`, props typées, Next.js 16 (App Router avec breaking changes)
- **Itération produit** : 15 phases livrées, chacune additive, refactor minimal entre les versions
- **Documentation projet** : `docs/plan.md` à jour, commits structurés (conventional commits)

---

## Pourquoi ça compte pour un recruteur

| Soft skill démontré | Preuve dans Polaris |
|---|---|
| **Autonomie technique** | 15 phases livrées seul, full-stack + IA + sécurité |
| **Pragmatisme** | Choix d'archi argumentés, Docker abandonné après analyse |
| **Souci UX** | Dark/light cohérents, sources cliquables, design system |
| **Sécurité** | Audit hook PEP 578, env clean, secrets jamais committés |
| **Communication écrite** | Cette doc, commits structurés, plan.md vivant |
| **Apprentissage continu** | Pile moderne (Tailwind v4, Next.js 16, .NET 9, DeepSeek V4) |
| **Test discipline** | 23/23 tests sandbox C# couvrant tous les cas tordus |

---

## Comment me l'expliquer en 30 secondes (elevator pitch)

> *"J'ai construit Polaris, un assistant pédagogique qui répond avec la doc officielle au lieu d'inventer. Architecture FastAPI + ChromaDB + DeepSeek, sandbox Python avec PEP 578 audit hook au lieu de Docker, sandbox C# via dotnet-script avec préprocesseur custom. 74 000 chunks indexés sur 19 corpus, exécution de code en chat, frontend Next.js 16 streaming SSE. Solo project, 15 phases, full-stack + sécurité applicative + LLM ops."*

---

## Comment me l'expliquer en 5 minutes (entretien)

1. **Le problème** : LLM hallucine, doc officielle illisible, apprenant perdu.
2. **La solution** : RAG sur doc officielle, sources citables, exécution intégrée.
3. **Le RAG en pipeline** : question → embedding → ChromaDB → top-K → LLM avec system prompt strict → SSE.
4. **Le sandbox Python** : pourquoi pas Docker, comment marche PEP 578, défense en profondeur.
5. **Le sandbox C#** : préprocesseur AST-lite pour transformer un programme classique en .csx runnable.
6. **Les intents** : design 100 % additif pour zéro régression.
7. **Les chiffres** : 19 corpus, 74k chunks, 429 concepts, 23/23 tests, $0.0005/question.
8. **Ce que je referais** : peut-être un gros embedding pour meilleur recall, peut-être un mode kernel persistant pour C#, plus de tests d'intégration.

---

## Liens à montrer en entretien

- `backend/sandbox.py` — sandbox Python avec audit hook PEP 578 (commenté en détail)
- `backend/sandbox_csharp.py` — sandbox C# avec préprocesseur (Phase 15.B)
- `backend/rag.py` — pipeline RAG
- `backend/prompts.py` — design system prompt + intents additifs
- `frontend/components/CodeBlock.tsx` — Monaco + Run button + sandbox output
- `frontend/lib/curriculum.ts` — 429 concepts structurés en données pures
- `docs/plan.md` — historique des 15 phases avec décisions argumentées

---

*Si vous lisez ceci dans un contexte recrutement : je suis intéressé par tout poste qui touche à la construction de systèmes (back, full-stack, infra, IA appliquée). Loïc Konan — devalinloic@gmail.com.*
