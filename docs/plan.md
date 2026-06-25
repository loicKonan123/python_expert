# Plan & avancement — Python Expert

Document vivant qui retrace **où on est**, **comment on y est arrivé**,
et **ce qui reste**. À garder à jour à chaque session de travail.

> 📌 Dernière mise à jour : 2026-06-21 (après Phase 7 + section "où vivent les corpus")

---

## 1. Vision

Un tuteur de développement web moderne qui répond avec :
- **fidélité absolue** à la documentation officielle (citations à l'appui)
- **multi-techno** : Python, FastAPI, Pydantic, Next.js, TypeScript, Tailwind + ton propre code
- **interaction notebook-style** : conversations multi-tours, kernel Python persistant
- **autonomie possible** (Ollama local) ou **performance** (DeepSeek API)

Cible : toi, étudiant qui apprend, qui veut un assistant **qui ne ment pas** et qui peut **vérifier son code**.

---

## ⭐ Niveau d'expertise par langage et techno

Évaluation honnête de **ce que le tuteur sait vraiment**, par techno.
Chaque ⭐ est gagnée sur 4 critères :
- **Couverture** : quelle part de la doc officielle est indexée
- **Profondeur** : peut-il répondre du débutant à l'avancé
- **Écosystème** : connaît-il les libs/outils tiers fréquemment associés
- **Fraîcheur** : date de la doc indexée

| Techno | Couverture | Profondeur | Écosystème | Fraîcheur | **Note** |
|---|---|---|---|---|---|
| **Python** | 100% doc officielle 3.14 | ⭐⭐⭐⭐⭐ du `print` aux métaclasses, async, GIL, descriptors | ⭐⭐⭐⭐ **avec pytest + httpx + SQLAlchemy** | Python 3.14 stable | **⭐⭐⭐⭐⭐** |
| **FastAPI** | 100% docs officielles | ⭐⭐⭐⭐⭐ routes, deps, OAuth2, WebSocket, lifespan | ⭐⭐⭐⭐ **avec SQLAlchemy + httpx + pytest** | Branche master | **⭐⭐⭐⭐⭐** |
| **Pydantic** | 100% docs v2 | ⭐⭐⭐⭐ validators, settings, JSON schema, computed_field | ⭐⭐⭐ **couvre pydantic-settings + bridges SQLAlchemy** | Branche main | **⭐⭐⭐⭐½** |
| **Next.js** | 100% docs intégrés (v16 App Router) | ⭐⭐⭐⭐⭐ Server/Client Components, Server Actions, caching | ⭐⭐⭐⭐ **avec TanStack Query + Zod** | Pinned sur la version installée | **⭐⭐⭐⭐⭐** |
| **TypeScript** | 100% Handbook v2 officiel Microsoft | ⭐⭐⭐⭐ types essentiels et avancés, génériques | ⭐⭐⭐⭐ **avec Zod + Vitest + TanStack Query** | Branche v2 | **⭐⭐⭐⭐⭐** |
| **Tailwind CSS** | 100% site officiel v4 | ⭐⭐⭐⭐ utilities, `@theme`, variants, container queries | ⭐⭐ plugins officiels seulement | Branche main | **⭐⭐⭐⭐** |
| **HTML** *(Phase 12)* | 100% référence MDN | ⭐⭐⭐⭐⭐ sémantique, formulaires, ARIA, médias, SEO | ⭐⭐⭐ ARIA + accessibilité couverts | Branche main MDN | **⭐⭐⭐⭐⭐** |
| **CSS** *(Phase 12)* | 100% référence MDN | ⭐⭐⭐⭐⭐ sélecteurs, box model, flex, grid, animations, custom props | ⭐⭐⭐⭐ avec Tailwind comme couche utilitaire | Branche main MDN | **⭐⭐⭐⭐⭐** |
| **JavaScript** *(Phase 12)* | 100% référence MDN | ⭐⭐⭐⭐⭐ syntaxe moderne, async, modules, classes, DOM | ⭐⭐⭐⭐ avec TypeScript + Zod + Vitest | Branche main MDN | **⭐⭐⭐⭐⭐** |
| **Ton code (`self`)** | 100% du repo courant | ⭐⭐⭐⭐ chaque fonction/classe identifiée | N/A | À jour à la dernière `build_index` | **⭐⭐⭐** |

### Écosystème (Phase 7) — libs tierces

| Lib | Pour | Note |
|---|---|---|
| **Pytest** | Testing Python (standard de l'industrie) | ⭐⭐⭐⭐⭐ |
| **HTTPX** | Client HTTP Python moderne (compagnon FastAPI) | ⭐⭐⭐⭐⭐ |
| **SQLAlchemy 2.x** | ORM Python avec FastAPI | ⭐⭐⭐⭐⭐ |
| **Zod** | Validation TS pour Next.js | ⭐⭐⭐⭐⭐ |
| **TanStack Query** | Data fetching React/Next.js | ⭐⭐⭐⭐⭐ |
| **Vitest** | Testing TS/JS moderne | ⭐⭐⭐⭐⭐ |

### Niveau global moyen : **⭐⭐⭐⭐¾ / 5** (après Phase 12)

### Pourquoi pas ⭐⭐⭐⭐⭐ partout

- **Tailwind** : reste à 4/5 car les plugins communautaires populaires
  (daisyUI, headlessui, etc.) ne sont pas indexés. Pour 5/5 il faudrait
  ajouter au moins `headlessui` et `tailwindui` (mais Tailwind UI est payant).
- **`self`** : reste à 3/5 car indexation ponctuelle (date de la dernière
  `build_index`) au lieu d'un suivi continu à chaque commit. Pour 5/5 il
  faudrait un hook git qui ré-indexe les fichiers modifiés.

### Pour pousser plus loin l'écosystème (jamais terminé)

Le tableau ci-dessus couvre le **stack web Python + Next.js typé**. Pour
d'autres orientations :
- Côté Python data : `pandas`, `numpy`, `scikit-learn`
- Côté Python ML : `pytorch`, `transformers`, `langchain`
- Côté frontend alternatif : `vue`, `svelte`, `solid`
- Côté backend alternatif : `django`, `flask`, `litestar`
- Côté ORM TS : `prisma`, `drizzle`
- Côté API typée : `trpc`

Chaque ajout = ~5 min de code + ~3 min de fetch + ~1 min de réindexation
incrémentielle (par chunk-corpus).

### Ce que **personne d'autre** ne couvre comme ça

Les 7 traits ci-dessous sont **rares ou inexistants** ailleurs (ChatGPT, Copilot, Stack Overflow) :

1. **Anti-hallucination** : chaque affirmation citée et traçable au paragraphe précis
2. **Réponses transversales** : un même chat ramène des chunks de 2-3 corpus avec citations croisées
3. **Le tuteur exécute son code** : kernel persistant Jupyter-style, variables conservées entre runs
4. **Il connaît TON code** : corpus `self`, citations de tes propres fonctions
5. **Local ↔ cloud d'un mot** : variable `.env` pour basculer Ollama / DeepSeek
6. **Coût visible en direct** : compteur live $$ + tokens dans le TopBar
7. **Audit hook de sécurité PEP 578** : ton `.env` (clé API) inaccessible même au code malveillant

---

## 2. État actuel — métrique unique

| Brique | Valeur |
|---|---|
| Corpus indexés | **19** (Python 3.14, FastAPI, Pydantic, Next.js, TypeScript, Tailwind, pytest, httpx, SQLAlchemy, Zod, TanStack Query, Vitest, HTML, CSS, JavaScript *(MDN, Phase 12)*, **C#**, **ASP.NET Core**, **EF Core** *(Microsoft Docs, Phase 13)*, **ton code**) |
| Chunks vectoriels | **74 080** *(post-Phase 13)* |
| Concepts pré-rédigés dans la sidebar | **214** (24 niveaux) — +36 concepts HTML/CSS/JS Phase 12 |
| Endpoints HTTP | 8 (`/api/ask`, `/api/run`, `/api/kernel/*`, `/api/usage`, `/api/health`, `/docs`, `/redoc`) |
| Tests de sécurité sandbox | **8/8 passent** |
| LOC repo (hors corpus + node_modules) | ~10 000 |
| Aperçu front live | ✅ via `<HtmlPreview>` (iframe sandboxée + Tailwind CDN) |

---

## 3. Avancement — ce qui est livré

### Phase 0 — Fondations (semaine 1)
- [x] RAG mono-corpus sur Python 3.14
- [x] Chunker Sphinx-aware (titres soulignés `===`/`---`)
- [x] Embeddings local CPU (`all-MiniLM-L6-v2`)
- [x] ChromaDB persistant
- [x] Backend stdlib `http.server` + SSE
- [x] Frontend HTML monolithique (parcours pédagogique)
- [x] Publication GitHub (commit initial)

### Phase 1 — Migration architecture
- [x] Backend **FastAPI** avec `lifespan` + Pydantic Settings
- [x] Frontend **Next.js 16 + Tailwind v4 + TypeScript**
- [x] Composants React typés (Sidebar, TopBar, ChatMessage, CodeBlock, ChatInput)
- [x] Monaco Editor pour les blocs de code
- [x] Streaming SSE multiplexé
- [x] CORS + middleware HTTP logging
- [x] Logs structurés partout (`backend.http`, `backend.rag`, etc.)

### Phase 2 — Multi-corpus
- [x] Manifeste `backend/corpora.py`
- [x] Script `fetch_docs.py` (clone shallow par techno)
- [x] Chunker multi-format (sphinx-text + markdown + mdx + rst)
- [x] Indexation FastAPI · Pydantic · Next.js · TypeScript · Tailwind
- [x] Métadonnée `corpus` par chunk → filtrage à la recherche
- [x] Test de benchmark retrieval (`test_retrieval.py`, 22 questions)

### Phase 3 — LLM providers
- [x] Abstraction `LLMProvider` (Protocol)
- [x] Provider **Ollama** local
- [x] Provider **DeepSeek API** (compatible OpenAI)
- [x] Bascule via `.env` (PYEXPERT_LLM_PROVIDER)
- [x] Tracker tokens + coût session (`/api/usage`)
- [x] Auto-routing **Flash / Reasoner** selon complexité de la question
- [x] Query rewriting (FR → EN ou follow-up résolu)
- [x] Pré-chauffage + keep_alive Ollama 30 min

### Phase 4 — UX moderne
- [x] Conversations multi-tours avec historique injecté au LLM
- [x] **Plusieurs threads** persistés (`pyexpert.conversations` dans localStorage)
- [x] Export d'une conversation en Markdown
- [x] Filtre par corpus (chips Tous/Python/FastAPI/.../Mon code)
- [x] Indicateur de qualité du retrieval (vert/jaune/rouge selon score)
- [x] Badges techno sur les réponses (puise dans : Python + FastAPI...)
- [x] Citations `[Source N]` cliquables → scroll + focus sur la source
- [x] Boutons Régénérer / Copier / Effacer / Nouvelle conv
- [x] Raccourcis Ctrl+B (sidebar), Ctrl+K (focus input), Ctrl+Shift+N (new conv)
- [x] Compteur live $ + tokens dans le TopBar
- [x] Persistance complète (F5 ne perd rien)

### Phase 5 — Sandbox d'exécution Python
- [x] **One-shot** : subprocess + temp dir + env nettoyé
- [x] Audit hook PEP 578 : bloque subprocess, os.system, ctypes externe
- [x] Bloque accès fichier hors sandbox + Python install (.env protégé)
- [x] Tracebacks propres : path masqué `<snippet>`, line numbers réalignés
- [x] **Kernel persistant** notebook-style (`backend/kernel.py`)
- [x] Pool de kernels indexé par session_id (= conversation id)
- [x] TTL d'inactivité 10 min + restart auto sur timeout
- [x] Bouton 🔄 restart kernel par bloc + endpoint dédié
- [x] Fix Unicode (errors='replace' sur stdin/stdout/stderr du kernel)
- [x] Cumul de blocs précédents en fallback (sans session)
- [x] 8/8 tests de sécurité passent

### Phase 6 — Indexation du code utilisateur
- [x] Format `code` dans `corpora.py`
- [x] Chunker code (découpe par fonction/classe via regex)
- [x] Champ `language` dans les métadonnées
- [x] `exclude_patterns` (node_modules, chroma_db, etc.)
- [x] Corpus `self` ajouté → 232 chunks du projet courant
- [x] Frontend : corpus `self` dans CORPUS_META + CorpusFilter (violet, `folder_code`)
- [x] Test : retrieval sur « what does my sandbox.py do » → bons fichiers
- [x] README à jour décrivant TOUT ce qui précède

### Phase 7 — Écosystème (libs tierces)
- [x] **Pytest** indexé (259 fichiers .rst depuis `pytest-dev/pytest/doc/en`)
- [x] **HTTPX** indexé (23 fichiers .md depuis `encode/httpx/docs`)
- [x] **SQLAlchemy 2.x** indexé (205 fichiers .rst depuis `sqlalchemy/sqlalchemy/doc/build`)
- [x] **Zod** indexé (18 fichiers .mdx+.md depuis `colinhacks/zod/packages/docs`)
- [x] **TanStack Query** indexé (71 fichiers .md depuis `TanStack/query/docs/framework/react`)
- [x] **Vitest** indexé (218 fichiers .md depuis `vitest-dev/vitest/docs`)
- [x] Frontend : 6 nouveaux items dans `Corpus` type + `CORPUS_META` + `CorpusFilter`
- [x] Couleurs de marque dédiées (Pytest cyan, HTTPX bleu Nord, SQLAlchemy rouge, Zod indigo, TanStack rouge React, Vitest jaune)
- [x] Réindexation complète : 20 053 → 28 367 chunks
- [x] Note globale passe de ⭐⭐⭐⭐ à **⭐⭐⭐⭐½**

### Phase 8 — Branding & landing page ✅
**Direction** : transformer le proto "Python Expert" en produit visuellement
abouti, prêt à être montré. Moins encombré, plus de personnalité, accessible.

**Nom verrouillé** : **Polaris** · **Direction design** : **B — Glass + gradient**

#### 8.1 Nettoyage UI immédiat
- [x] Cacher le widget tokens/coût dans le TopBar (data restent dispo via `/api/usage`)
- [x] Réduire le statut "Backend connecté" à une simple pastille colorée + tooltip
- [x] Retirer le polling `checkUsage` (économie de requêtes)
- [x] Audit général des labels verbeux

#### 8.2 Renommage du produit → Polaris
- [x] `<title>`, metadata, root API, backend log, README rebrandés
- [x] Wordmark "Polaris" en Geist semi-bold avec logo intégré dans TopBar + landing
- [ ] Renommer le repo GitHub (optionnel, à faire à la main)

#### 8.3 Identité visuelle (SVG de marque)
- [x] Mark abstrait : étoile à 8 branches (4 cardinales + 4 diagonales) avec cœur radial
- [x] Favicon `app/icon.svg` avec fond gradient navy
- [x] Animation `polaris-twinkle` au hover (rotate + drop-shadow, respecte reduced-motion)
- [ ] OG image (à générer plus tard)

#### 8.4 Mode light
- [x] Palette light définie via `[data-theme="light"]` sur `<html>`
- [x] `ThemeToggle` cyclique (dark → light → system) dans le TopBar
- [x] Persistance `localStorage["polaris-theme"]` + détection `prefers-color-scheme`
- [x] Script anti-FOUC injecté dans `<head>` avant le premier paint
- [x] Adaptation Monaco (`vs` / `vs-dark`) via hook `useTheme()`
- [x] Glass cards inversées en light (fond blanc translucide au lieu de noir)

#### 8.5 Landing page publique
- [x] Nouvelle route `/` (landing) — app déplacée vers `/app`
- [x] Hero : baseline "Le tuteur dev qui ne ment pas." + gradient sur l'accroche
- [x] Bandeau des 13 corpus indexés avec pastilles couleurs officielles
- [x] Section USP (3 cartes : sourcé, exécuté, hub multi-corpus)
- [x] CTA final + footer
- [ ] Demo interactive (chat pré-rempli) — backlog post-Phase 8

#### 8.6 Design system modernisé (Glass + Gradient)
- [x] Mesh gradient background : 3 orbes (primary/secondary/tertiary) qui dérivent
- [x] Classes `.glass-card` + `.glass-card-strong` (frosted glass + bordure + inset shadow)
- [x] Application aux bulles bot/user, input, TopBar, Sidebar
- [x] Send button avec gradient `primary → #3776ab` + glow shadow
- [x] Respect `prefers-reduced-motion` sur toutes les animations

#### 8.7 Itérations post-commit (sobre, light propre, 3D, interactif)

Après le premier push Phase 8 (`5a1a290`), une grosse passe d'itération a
suivi pour resserrer le design. Commit de référence : `bcdd857`.

**Suppression du violet → palette à 3 couleurs**
- [x] Tous les `#8b5cf6` / `#c084fc` / `#bb9af7` retirés (CTAs, gradients texte, ScrollProgress, avatars, mesh orbs)
- [x] Palette resserrée à 3 couleurs : navy bg + indigo CTA (`#4f46e5`) + gold accent (`#fbbf24`)
- [x] Aucun gradient texte rainbow — soit solide soit 2 couleurs max

**Light mode adaptatif (refonte profonde)**
- [x] CSS variables `--color-action` et `--color-accent` qui swappent par `[data-theme]` (indigo/gold en dark, teal/teal en light)
- [x] Migration globale `bg-[#4f46e5]` → `bg-action`, `text-[#fbbf24]` → `text-accent` dans tous les composants
- [x] SVG fills hardcodés (PolarisLogo, HeroOrbits, Constellation, particules) migrés vers `var(--color-accent)` pour s'adapter au thème
- [x] Fond light passé de `#f5f7fb` à `#e6ebf2` (gris-bleu sourd) pour que les cartes blanches détachent
- [x] Glass cards repassent en blanc solide + ombres multicouches en light (vs verre dépoli en dark)
- [x] Mesh orbs, particules et constellation éteints en light (faisaient cheap)
- [x] Fenêtres de code (HeroCodePreview, MiniCodeWindow, CodeBlock) avec classe `.hero-code-preview` adaptative (navy en dark, gris-bleu clair en light)
- [x] Snippets Python flottants du HeroOrbits migrés en `var(--color-on-surface-variant)`

**Effet 3D pop-out**
- [x] Système d'ombres multicouches sur glass-card / glass-card-strong (inset highlight + contour + ombre principale + halo diffus)
- [x] Hover lift avec `transform: translateY(-2px)` + ombres amplifiées
- [x] Respect `prefers-reduced-motion`

**Hero refait — InteractiveHero (constellation interactive)**
- [x] Copie centrée en haut (h1 + paragraphe + 2 CTAs), max-w-3xl
- [x] **Panneau interactif plein largeur** dessous : constellation (60%) + démo card (40%) côte à côte, dans une seule glass-card-strong
- [x] **6 satellites cliquables** autour du logo Polaris central (Python, FastAPI, Pydantic, Next.js, TypeScript, Tailwind)
- [x] **Démo card live** qui change à chaque clic — question + réponse + code + citation source (URL doc officielle)
- [x] Typewriter qui re-anime à chaque changement de satellite (via `key={satellite.key}`)
- [x] Satellites placés à 15-85% (au lieu de 8-92%) pour éviter overflow sur écran étroit
- [x] Sélection par défaut : **FastAPI** (démo la plus parlante)

**ChatInput compact (résout aussi un conflit de scroll)**
- [x] Sources et Intent passent en **popovers** au lieu de bandeaux inline qui prenaient ~200px de hauteur
- [x] Layout 1 ligne : `[Sources pill] [Intent pill] [textarea] [Send]`
- [x] Click extérieur / Escape ferme les popovers
- [x] L'intent détecté affiche sa valeur dans le pill (`Intent · Refactor`)
- [x] Pills cachés en mobile (`hidden sm:inline-flex`)
- [x] Popovers en `w-[min(340px,calc(100vw-2rem))]` → ne dépassent plus du viewport
- [x] Padding bottom du chat passé de `pb-44` à `pb-28` (input plus compact)

**ThemeToggle simplifié + sur landing**
- [x] Bouton **2 états seulement** : toggle dark ↔ light (plus de "system")
- [x] L'icône indique l'action future (soleil quand on est en dark, lune en light)
- [x] `data-theme` initial lu du DOM (posé par THEME_INIT_SCRIPT) — fix race condition d'init React qui écrasait la préférence
- [x] Ajouté à la `LandingNav` (en plus de la TopBar de l'app)
- [x] Persistance localStorage[`polaris-theme`]

**Audit responsive**
- [x] Sidebar mobile : backdrop noir blur + auto-close après pick de concept (`window.innerWidth < 768`)
- [x] ConversationsMenu popover : width clampée pour ne pas overflow
- [x] LandingNav : burger mobile + drawer (déjà fait Phase 8)
- [x] TopBar app : delete_sweep + GitHub cachés en `< sm`
- [x] Tous les `bg-white/X` migrés vers `bg-on-surface/X` (adaptatif au thème)
- [x] Sélection de texte, focus rings, scrollbar passés en CSS vars brand

**Sections landing supplémentaires**
- [x] `LandingNav` sticky avec sections actives détectées au scroll (Concept · Identité · Comparaison)
- [x] Bandeau stats animé `CountUp` (99.8% / 0ms / 13 / 28367)
- [x] Bento bento 7+5+12 cols avec mini-widgets (CoverageBar, MiniCodeWindow, belt corpus)
- [x] Section **Identité** : 3 variantes du logo (animated / static / mono)
- [x] Table **comparaison** Polaris vs LLM générique (5 lignes ✓/✗)
- [x] Footer 4 colonnes + "Systems operational" status
- [x] `ScrollProgress` (barre fine en haut, gradient indigo→gold)
- [x] `ScrollToTop` flottant (apparaît après 600px de scroll)
- [x] Page 404 custom avec constellation + branding
- [x] Tous les wordmark/logo "Polaris" cliquables vers `/`
- [x] Sidebar curriculum : nettoyée (retrait New Session CTA / Aide / Notes de version)
- [x] Hero badge "v1.0 · RAG local · 13 corpus" et stack bar **retirés** (trop encombrés)

**Animations + interactivité**
- [x] `Tilt3D` — perspective 3D au survol des cartes USP, identité, comparaison, CTA
- [x] `Reveal` — fade-in + translateY au scroll via IntersectionObserver (effet staggered)
- [x] `CountUp` — chiffres animés 0→cible quand entrée dans le viewport (cubic ease-out)
- [x] `Typewriter` — texte tapé caractère par caractère (DemoCard du hero)
- [x] `polaris-bounce` — 3 dots de chargement qui bouncent en cascade pendant streaming
- [x] `caret-pulse` — typing-caret ambre pulsant avec glow (remplace le `▍` block)
- [x] Pulse, drift, twinkle sur tout (mesh orbs, particules, satellites, étoiles)
- [x] Tous les `<animate>` SVG + keyframes CSS respectent `prefers-reduced-motion`

### Phase 9 — Intents câblés ✅

**Constat actuel** : la barre d'intents dans le `ChatInput` (Refactor, Debug,
Generate, Explain) **ne change rien côté backend**. Cliquer un intent injecte
juste un préfixe texte (`"Refactor: "`) dans l'input. Le LLM se débrouille.
Pour que ces boutons aient une valeur produit, il faut les câbler vraiment.

**Décision** : on passe à **6 intents** (sweet spot UX : couvre tout le
workflow dev sans devenir un menu) et on les câble réellement.

#### 9.1 Les 6 intents officiels

| # | Intent | Cas d'usage | Système prompt (essence) | Boost retrieval |
|---|---|---|---|---|
| 1 | **Generate** | Partir de zéro | "Code runnable + docstring + un exemple d'usage" | stdlib + libs nommées dans la question |
| 2 | **Explain** | Comprendre un code/concept | "Junior dev, analogies, pas de jargon non défini" | 1 seul corpus, plus de contexte par chunk |
| 3 | **Refactor** | Améliorer la **structure** | "Avant/après + pourquoi de chaque changement" | `self` (le code de l'utilisateur) |
| 4 | **Debug** | Trouver et fixer un bug | "Cause racine + fix minimal + test de non-régression" | corpus détectés dans le stack-trace |
| 5 | **Test** *(nouveau)* | Écrire des tests | "Golden path + edge cases + erreurs, suit la convention du projet" | pytest, httpx, vitest |
| 6 | **Optimize** *(nouveau)* | Améliorer la **performance** | "Mesure avant/après, identifie le bottleneck, justifie le gain" | stdlib (functools, asyncio), `self` |

Pourquoi pas d'autres ?
- "Review" se confond trop avec Refactor
- "Document" est un sous-cas d'Explain (sortie = docstring vs prose)
- "Migrate" est trop niche pour mériter une pill permanente

#### 9.2 Travail backend

- [x] Endpoint `/api/ask` accepte un champ `intent: Literal["generate", "explain", "refactor", "debug", "test", "optimize"] | None`
- [x] Dictionnaire `INTENT_PROMPTS` dans `backend/prompts.py` qui mappe chaque intent vers son system prompt (6 entrées détaillées)
- [x] Si `intent` est fourni → injection d'un paragraphe `## Intention de cette requête (Phase 9)` qui s'ajoute au SYSTEM_PROMPT existant (le SYSTEM_PROMPT n'est jamais modifié — 100% additif)
- [x] Dictionnaire `INTENT_CORPUS_BOOST` qui boost +15% le score des chunks d'un corpus listé pour l'intent (retrieve k*2, applique boost, re-trie, coupe au top-k)
- [x] Logger l'intent dans les logs RETRIEVAL avec corpus boostés effectifs

#### 9.3 Travail frontend

- [x] `ChatInput` passe à 6 pills (ajout Test + Optimize) avec hints courts pour chacun
- [x] Cliquer une pill ne fait plus de prefix texte — change le state global `intent` au parent (`app/app/page.tsx`)
- [x] Visuel : la pill active a un glow ambre + le label du pill `Intent` montre l'intent choisi
- [x] Type `AskOptions.intent` ajouté à `lib/api.ts`, forwardé dans le body POST de `/api/ask`
- [x] Persistance `localStorage["polaris-intent"]` avec restore au boot
- [x] Option "Aucun intent" dans le popover pour revenir au comportement défaut
- [ ] ~~Bot message badge~~ : volontairement non fait — l'intent est déjà visible dans le pill, pas la peine de dupliquer (décision UX)

#### 9.4 Auto-routing modèle (optionnel, phase 9 bis)

- [ ] `Debug` → reasoning model (deepseek-r1 quand dispo, fallback deepseek-chat)
- [ ] `Generate` + `Refactor` → coder model (deepseek-coder ou qwen2.5-coder)
- [ ] `Explain` + `Test` + `Optimize` → modèle généraliste rapide
- [ ] Garder l'auto-routing existant pour les questions sans intent explicite

### Phase 10 — Mode de réponse (concis / détaillé)

**Constat** : le system prompt actuel pousse Polaris à tout expliquer comme à
un junior. Idéal pour apprendre mais lourd quand un dev senior veut juste
*"comment je fais X en FastAPI"* et avoir 3 lignes de réponse + un snippet.

**Mécanisme** : un toggle 2 états dans la TopBar (à côté du ThemeToggle) qui
passe un paramètre `verbosity: "concise" | "detailed"` au backend, lequel
charge un system prompt différent. Pas de retrieval changé, pas de routing
modèle. Le toggle est persisté dans `localStorage["polaris-verbosity"]` au
niveau global (pas par conversation).

#### 10.1 Backend
- [ ] `/api/ask` accepte `verbosity: Literal["concise", "detailed"] = "detailed"`
- [ ] `backend/llm/prompts.py` : 2 system prompts distincts
  - **Concise** : "Tu réponds à un dev expérimenté. Code d'abord. Une phrase de contexte max. Citations obligatoires. Pas de blabla pédagogique."
  - **Detailed** (actuel) : "Tu enseignes à un dev en apprentissage. Analogies, exemples, contexte. Citations obligatoires."
- [ ] Composition : intent (Phase 9) > verbosity > base prompt

#### 10.2 Frontend
- [ ] Composant `VerbosityToggle` dans la TopBar (icône `notes` vs `subject`)
- [ ] State global → `lib/verbosity.ts` (pattern identique à `theme.ts`)
- [ ] Le mode est passé à `askStream()` comme l'intent
- [ ] Bot message badge : mini pill `concise`/`detailed` si non-défaut

### Phase 11 — Environnement Python complet (Docker) ❌ ABANDONNÉE

**Statut** : implémentée puis **entièrement revertée** (commit suivant la
décision de produit du 2026-06-24). Tout le code est supprimé.

**Pourquoi on a essayé** : permettre l'exécution de FastAPI, httpx, pytest
dans un container Docker isolé, avec ports forwardés et iframe live pour
voir un serveur uvicorn tourner.

**Pourquoi on a arrêté** :
1. **Friction OS énorme** : Windows + Docker Desktop + encoding cp1252 vs
   UTF-8 = succession de bugs (image build qui plante, subprocess qui ne
   décode pas Docker logs, ports pas mappés, container fantômes).
2. **Race conditions multiples** : uvicorn boot async dans un thread vs
   httpx.get instantané → ConnectionRefused systématique. On a essayé des
   helpers magiques (`serve()`, `wait_for()`) puis un patch transparent de
   `uvicorn.run`, mais le LLM générait quand même du code qui ratait.
3. **Pas le bon design** : aucun produit du marché ne lance des serveurs
   live dans un chat tuteur. Ni ChatGPT Code Interpreter, ni Claude
   artifacts. Replit/Codespaces sont des IDE complets — ce n'est pas le
   positionnement de Polaris.
4. **Le bon pattern existait** : pour démontrer FastAPI, **TestClient**
   suffit. C'est synchrone, instantané, ne nécessite ni uvicorn ni port,
   et c'est ce que tous les devs FastAPI utilisent dans leurs tests.

**Leçon** : revenir à l'essentiel. Le sandbox léger Python existant
(`backend/sandbox.py` + `backend/kernel.py`) couvre 95% des cas. Pour les
démos visuelles front-end, voir Phase 12.

**Sous-sections 11.1 à 11.7 archivées ci-dessous à titre historique.**

#### 11.1 Architecture cible

| Composant | Choix |
|---|---|
| Base image | `python:3.14-slim` custom (Dockerfile dédié) |
| Pré-installés | fastapi, uvicorn, pydantic, httpx, sqlalchemy + aiosqlite, pytest + pytest-asyncio |
| Isolation | 1 container par conversation (session) |
| Lifecycle | Créé au premier "Run complet" de la session, killé après 10min idle |
| Filesystem | Volume éphémère `/workspace`, jeté à la destruction du container |
| Réseau | `--network bridge` (accès PyPI pour pip install possible). Pas d'accès LAN/intranet. |
| Limits | `--memory 512m --cpus 1 --pids-limit 100` |
| Ports | Port haut aléatoire forwardé à chaque exposition de serveur uvicorn/flask détecté |
| Timeout exec | 60s par cellule (vs 10s pour le sandbox light) |
| Backend → Docker | SDK Python `docker` (pas de subprocess, plus propre) |

#### 11.2 Dockerfile (`backend/sandbox/Dockerfile`)
- [ ] `FROM python:3.14-slim`
- [ ] Install des deps Polaris-corpus
- [ ] User non-root `runner` (UID 1001), `WORKDIR /workspace`, `chown` à runner
- [ ] Entrypoint = script `runner.py` qui lit du code sur stdin, l'exécute, renvoie résultat
- [ ] Build via `docker build -t polaris-sandbox:3.14 .` (au premier démarrage backend si image absente)

#### 11.3 Backend — `backend/sandbox/full_runner.py`
- [ ] Classe `FullSandboxManager` qui gère le pool de containers par session
- [ ] `get_or_create(session_id) → container_id`
- [ ] `run(session_id, code, timeout=60) → RunResult { stdout, stderr, exit_code, elapsed_ms, exposed_ports[] }`
- [ ] Détection des ports écoutés via `docker exec ... lsof -i -P -n | grep LISTEN`
- [ ] `restart(session_id)` pour réinitialiser le container
- [ ] Idle timer (asyncio task) qui kill les containers inactifs depuis 10min
- [ ] Hook lifecycle FastAPI : `await manager.shutdown_all()` au stop du serveur

#### 11.4 Endpoint `/api/sandbox/full/run`
- [ ] POST `{ session_id, code }` → `RunResult`
- [ ] POST `/api/sandbox/full/restart` → reset le container
- [ ] WebSocket optionnel `/ws/sandbox/full` pour stream stdout en live (utile pour les longs runs comme `uvicorn`)

#### 11.5 Frontend — UI "Run complet"
- [ ] Bouton secondaire `Run complet` à côté du `Run` actuel dans le CodeBlock (icône `rocket_launch` ou `play_circle` filled)
- [ ] Indicateur "container actif" dans la TopBar (dot vert + "Polaris kernel")
- [ ] Quand le run expose un port → carte glass qui apparaît avec `<iframe src="http://localhost:<port>">` + bouton "ouvrir dans un onglet"
- [ ] Panneau "Logs du container" déroulable sous l'iframe pour voir uvicorn stdout en live
- [ ] Bouton "Restart kernel" dans la même zone

#### 11.6 Garde-fous
- [ ] Vérif au démarrage backend : Docker est dispo (`docker info`) sinon désactive la feature avec message clair
- [ ] Confirmation utilisateur avant le premier `Run complet` (consentement explicite)
- [ ] Indicateur visuel "réseau ouvert" pour rappeler que `pip install` ira sur PyPI
- [ ] Quota max : 1 container à la fois par session (les autres conversations partagent ou attendent)
- [ ] Logs structurés de chaque container créé/détruit dans `backend/logs/sandbox-full.jsonl`

#### 11.7 Tests
- [ ] Test : créer container, exécuter `print("hello")`, vérifier stdout
- [ ] Test : lancer `uvicorn main:app` en background, détecter port, faire requête depuis le host
- [ ] Test : `pip install requests` puis import → marche
- [ ] Test : kernel persistant (variable définie dans run 1 visible dans run 2)
- [ ] Test : idle timeout fonctionne (mock time)
- [ ] Test : container kill au shutdown FastAPI

### Phase 12 — Stack front-end (HTML/CSS/JS) + Aperçu iframe ✅

**Constat** : Polaris se vendait comme "tuteur dev full-stack" mais
n'indexait que TypeScript et Tailwind côté front. Pas de HTML pur, pas de
CSS hors Tailwind, pas de JavaScript vanilla. Et le sandbox Python ne
permet pas de rendre du HTML.

**Décision** : ajouter les **3 corpus MDN** (référence absolue pour le web)
+ un système **d'aperçu live front-end** dans le chat, façon "artifacts"
de Claude ou Code Interpreter de ChatGPT — sans serveur backend, juste un
`<iframe srcDoc>` sandboxé par le navigateur.

#### 12.1 Indexation MDN (HTML, CSS, JavaScript)
- [x] 3 nouveaux corpus dans `backend/corpora.py` :
  - `html` → `mdn/content` subpath `files/en-us/web/html` (253 fichiers)
  - `css` → idem subpath `files/en-us/web/css` (1 232 fichiers)
  - `javascript` → idem subpath `files/en-us/web/javascript` (1 330 fichiers)
- [x] Fetch via `python -m backend.scripts.fetch_docs --corpus <name>` (clone shallow + extract subpath)
- [x] Réindexation : **28 367 → 47 094 chunks** (+18 727, +66 %)
- [x] Frontend : type `Corpus` étendu, `corpus-meta.ts` (couleurs HTML rouge #E34F26, CSS bleu #1572B6, JS jaune #F7DF1E), `Sidebar.tsx` CORPUS_META, `CorpusFilter.tsx` ALL_CORPORA, landing bandeau corpus, landing stat `13 → 16 corpus` et `28k → 47k chunks`

#### 12.2 Composant HtmlPreview (iframe sandboxée)
- [x] Nouveau composant `frontend/components/HtmlPreview.tsx`
- [x] Détection automatique du `lang` du CodeBlock : si `html`/`css`/`javascript`/`js` → bouton **"Aperçu"** dans le header (icône `visibility`)
- [x] **Smart wrapper** selon le langage :
  - `html` : code utilisé tel quel (DOCTYPE + Tailwind CDN injectés si absents)
  - `css` : enveloppé dans un document avec placeholder visuel (h1, p, button, ul, .card) auquel le CSS s'applique
  - `javascript` : enveloppé avec `<div id="app">` + **console mirror visible** (`console.log` apparaît dans une carte navy en bas)
- [x] **Tailwind CDN** auto-injecté dans `<head>` → l'utilisateur peut utiliser les classes Tailwind sans config
- [x] `<iframe sandbox="allow-scripts">` → JS du code utilisateur tourne, mais pas d'accès à `parent`/`top`/cross-origin

#### 12.3 System prompt mis à jour
- [x] Le LLM est informé qu'il a accès à HTML/CSS/JavaScript MDN
- [x] Nouvelle règle : pour démos visuelles, utiliser des blocs `html`/`css`/`javascript` → l'utilisateur verra le rendu en cliquant Aperçu
- [x] Mention que Tailwind est dispo via CDN dans l'iframe par défaut (pas la peine de le re-importer)
- [x] Règle E réécrite : **pour FastAPI utiliser `TestClient`** (pas uvicorn) — synchrone, instantané, pattern standard
- [x] Suppression de toutes les mentions Docker/`serve()`/`pip()` du prompt (héritage Phase 11)

#### 12.4 Curriculum
- [x] 3 nouveaux niveaux ajoutés dans `frontend/lib/curriculum.ts` :
  - **HT1** Structure & sémantique (12 concepts : DOCTYPE, balises sémantiques, titres, liens, listes, images, tables, forms, validation, médias, ARIA, SEO)
  - **CS1** Sélecteurs, box model & layout (12 concepts : sélecteurs, spécificité, pseudo-classes, box model, display/position, flexbox, grid, unités, couleurs modernes, vars, responsive, animations)
  - **JS1** Syntaxe moderne (12 concepts : let/const, types, array methods, destructuring, arrow, promises, modules ES, classes, closures, DOM, fetch, optional chaining)
- [x] Chaque concept a sa question optimisée en anglais pour le RAG MDN
- [x] **+36 concepts** dans la sidebar du curriculum

#### 12.5 InteractiveHero — 9 satellites
- [x] Passage de 6 à 9 satellites dans `InteractiveHero.tsx`
- [x] Anneau intérieur (3 langages fondamentaux, 120° apart, radius ~25 %) :
  Python · JavaScript · FastAPI
- [x] Anneau extérieur (6 frameworks, 60° apart offset 30°, radius ~38 %) :
  TypeScript · HTML · Pydantic · Next.js · Tailwind · CSS
- [x] Démos live ajoutées pour HTML (structure sémantique), CSS (Flexbox centering), JavaScript (flatMap vs map), avec URLs vers MDN

#### 12.6 Cleanup Phase 11 (Docker)
- [x] `backend/sandbox_full/` (Dockerfile + manager.py + runner.py + __init__.py) supprimé
- [x] `backend/routes/run_full.py` supprimé
- [x] `backend/main.py` nettoyé (plus de `is_docker_available`, `ensure_image_built`, `FullSandboxManager` ni le bloc lifespan Docker)
- [x] Frontend `CodeBlock.tsx` nettoyé (plus de `executeFull`, `dockerAvailable`, `hostPorts`, `LivePortsPanel`)
- [x] Frontend `lib/api.ts` nettoyé (plus de `runPythonFull`, `restartFullSandbox`, `getFullSandboxStatus`, types `FullRunResult`/`FullSandboxStatus`)
- [x] Image Docker locale `polaris-sandbox:3.13` à supprimer (`docker rmi polaris-sandbox:3.13`)

### Phase 13 — Écosystème .NET (C# + ASP.NET Core + EF Core) ✅

**Décision** : élargir Polaris de "tuteur full-stack web (Python + JS/TS)" vers
**polyglot backend** en ajoutant l'écosystème .NET officiel Microsoft. Pattern
miroir de la Phase 7 — trois corpora qui couvrent langage + framework web + ORM.

#### 13.1 Trois corpora ajoutés

| Corpus | Source | Subpath | Équivalent Python |
|---|---|---|---|
| **`csharp`** | `github.com/dotnet/docs` | `docs/csharp` | ≈ Python |
| **`aspnet`** | `github.com/dotnet/AspNetCore.Docs` | `aspnetcore` | ≈ FastAPI |
| **`efcore`** | `github.com/dotnet/EntityFramework.Docs` | `entity-framework/core` | ≈ SQLAlchemy |

- [x] Manifeste `backend/corpora.py` : 3 entrées (`csharp` 1 031 fichiers, `aspnet` 1 674, `efcore` 180 → **2 885 fichiers .md** ajoutés)
- [x] Frontend `lib/curriculum.ts` : type `Corpus` étendu avec les 3 nouvelles clés
- [x] `lib/corpus-meta.ts` : couleurs officielles (C# violet `#9B82E6`, ASP.NET `#A88FE6`, EF Core `#6FA9E6`) + icônes Material Symbols (`code_blocks`, `dns`, `storage`)
- [x] `Sidebar.tsx` CORPUS_META : 3 entrées
- [x] `CorpusFilter.tsx` ALL_CORPORA : 3 entrées
- [x] Landing `app/page.tsx` : 3 nouvelles pastilles dans le bandeau corpus, stat passée 16 → **19 corpus**, bento card 3 textuelle mise à jour

#### 13.2 Fetch + réindex

- [x] Fetch via `python -m backend.scripts.fetch_docs --corpus <name>` (10 min total)
- [x] Réindex `build_index` : **47 094 → 74 080 chunks** (+26 986, +57 %)
- [x] Test retrieval validé sur 3 questions distinctes :
  - "C# async await Task syntax" → score 0.74 sur `language-reference/keywords/async.md`
  - "ASP.NET Core endpoint routing middleware" → score 0.78 sur `fundamentals/routing/`
  - "Entity Framework Core LINQ query DbSet" → score 0.74 sur `querying/how-query-works.md`

#### 13.3 Pas de curriculum dédié (à voir)

Phase 13 v1 = corpus seulement, sans concepts pré-rédigés dans la sidebar
curriculum (contrairement à Phase 12 HTML/CSS/JS qui avait +36 concepts).
Raison : le pattern de questions .NET est plus hétérogène (langage, framework,
ORM tous différents), et l'utilisateur peut déjà filtrer par corpus dans le
ChatInput. À reconsidérer si la sidebar curriculum apparaît comme la voie
d'entrée principale pour les utilisateurs .NET.

### Phase 14 — Curriculum approfondi + frontend completeness audit (en cours)

**Constat** : la sidebar curriculum est une voie d'entrée pédagogique
**excellente** — cliquer un concept génère automatiquement la bonne question
RAG (en anglais, optimisée). Mais après les Phases 7, 12, 13, on a un gros
déséquilibre : **9 corpora sur 19 ont des niveaux dans la sidebar**, les
**10 autres sont muets** (pytest, httpx, sqlalchemy, zod, tanstack_query,
vitest, csharp, aspnet, efcore — tous accessibles via filtre Sources mais
invisibles dans le curriculum).

**Objectif** : pour chaque techno, atteindre une couverture curriculum
"complète" qui maximise l'apprentissage. Cible : ~25 nouveaux niveaux, ~250
nouveaux concepts. Découpé en 3 sessions livrables indépendamment.

#### 14.A — Frontend audit + niveaux .NET (Session A)

Frontend completeness à vérifier maintenant qu'on a 19 corpora :
- [ ] Sidebar curriculum : 10 corpora muets → ajouter les sections (au moins
      pour .NET dans cette session)
- [ ] InteractiveHero : 9 satellites sur 19 — décider si on en ajoute,
      ou si la sélection actuelle reste "highlight" (probablement la 2e option)
- [ ] Landing bento card 3 : juste un paragraphe textuel — pourrait être
      visualisé (icônes par techno ou mini-grille)
- [ ] Vérifier autres surfaces : prompt système, AGENTS.md, etc.

Niveaux .NET à ajouter :
- [ ] **CS1** C# · Bases du langage (syntaxe, types, classes, structs, properties, records)
- [ ] **CS2** C# · LINQ + async/await + génériques + nullable types
- [ ] **AS1** ASP.NET Core · Bases (Minimal API, MVC, routing, model binding)
- [ ] **AS2** ASP.NET Core · Avancé (DI, middleware, auth, SignalR, configuration)
- [ ] **EF1** EF Core · Bases (DbContext, migrations, LINQ queries, conventions)
- [ ] **EF2** EF Core · Avancé (relations, eager/lazy loading, change tracking, perf)

#### 14.B — Niveaux écosystème Phase 7 (Session B, plus tard)

- [ ] **PT1** pytest · Fixtures + parametrize + markers + async
- [ ] **HX1** httpx · Async client + retry + auth + streaming
- [ ] **SA1** SQLAlchemy · Core vs ORM + sessions + relationships
- [ ] **SA2** SQLAlchemy · Async + Alembic migrations + perf
- [ ] **ZD1** Zod · Schemas + transformations + discriminated unions
- [ ] **TQ1** TanStack Query · Query, Mutation, invalidation, suspense
- [ ] **VT1** Vitest · Tests unitaires + mocks + coverage

#### 14.C — Approfondir corpora existants (Session C, plus tard)

- [ ] Pydantic : ajouter **PD3** (settings, JSON schema, computed_field, extras avancés)
- [ ] Tailwind : ajouter **TW3** (animations avancées, theming dynamique, Tailwind UI patterns)
- [ ] HTML : ajouter **HT2** (Web Components, Custom Elements, Shadow DOM, accessibilité avancée)
- [ ] CSS : ajouter **CS2** (Container Queries avancé, Cascade Layers, Subgrid, View Transitions)
- [ ] JavaScript : ajouter **JS2** (Iterators/Generators, Proxy/Reflect, Web APIs, modules workers)

---

## Naming — 5 candidats à valider

Critères : court (≤ 8 lettres), prononçable EN + FR, évoque savoir / fiabilité /
source, mémorisable, domaine probablement disponible.

| Nom | Origine / sens | Tagline possible | Vibes |
|---|---|---|---|
| **Polaris** | Étoile polaire (l'étoile qui guide) | *"Code answers, sourced."* | Sophistiqué, classique, fiable |
| **Sourced** | Décrit littéralement l'USP | *"Every answer, sourced."* | Direct, anglo-saxon, SEO friendly |
| **Codex** | Livre antique de connaissance | *"Your code's living manual."* | Fort, mémorisable, risque collision OpenAI Codex |
| **Veritas** | Latin « vérité » | *"The honest tutor."* | Sérieux, philosophique, un peu prétentieux |
| **Doxa** | Grec « savoir / opinion » | *"Where docs become wisdom."* | Court, moderne, mystérieux, brandable |

**Recommandation perso** : **Polaris** — sophistiqué et descriptif (boussole/guide),
zéro collision connue, easy à pitcher *"Polaris, votre étoile pour naviguer dans la doc."*

---

## Direction design — 3 moods au choix

| Mood | Inspiration | Vibe émotionnelle |
|---|---|---|
| **A. Editorial sobre** | Linear, Vercel, Stripe Docs | Premium, calme, dense en infos. Beaucoup de blanc, accents subtils, typographie majestueuse. Public : devs seniors, contenu first. |
| **B. Glass + gradient** | Apple Vision Pro UI, Arc Browser | Moderne, frosted glass, gradients vivants, profondeur. Public : audience plus large, effet "wow". |
| **C. Brutalist soft** | Notion, Linear early days, Raycast | Bordures nettes, monochromes contrastés, micro-éléments décoratifs. Public : devs créatifs, style affirmé. |

**Recommandation perso** : **B** (Glass + gradient) → moderne sans être démodable
dans 6 mois, marche bien en light ET dark, valorise le côté "produit fini".

---

## 4. Roadmap — ce qui reste

### 🟢 Court terme (1-3 h chacun)

- [ ] **Hybrid search BM25 + vector**
      Combine recherche vectorielle (sémantique) + lexicale (mots-clés exacts).
      Améliore la récupération sur les termes techniques rares ou les fautes.
      Lib : `rank-bm25`. Effort : 3 h.

- [ ] **Embedding `bge-m3` multilingue**
      Remplace `all-MiniLM-L6-v2` (anglais 384d) par BGE-M3 (multilingue 1024d).
      Score FR moyen attendu : 0.64 → 0.78. Effort : 30 min code + 25 min réindex.

- [ ] **Mobile UX sérieuse**
      Sidebar en drawer, taille des chips, viewport meta correct.
      Aujourd'hui utilisable mais pas joli. Effort : 2 h.

- [ ] **Test du sandbox kernel via le navigateur**
      On a validé en HTTP (curl), pas dans l'UI réelle. Effort : 15 min.

### 🟡 Moyen terme (3 h - 1 j)

- [ ] **LLM function calling**
      Le bot décide quand appeler `run_python()` lui-même, voit la sortie, se corrige.
      Requiert un loop multi-turn de tool use côté backend.
      DeepSeek supporte les tools.
      Effort : 1 jour.

- [ ] **Re-ranker post-retrieval**
      Cross-encoder (`ms-marco-MiniLM-L-6-v2`) qui re-trie les top-30 → top-K.
      +5-10% de pertinence. Effort : 2-3 h.

- [ ] **HyDE** (Hypothetical Document Embeddings)
      Le LLM génère une fausse réponse, on embed cette fausse réponse pour chercher.
      Très efficace sur les questions abstraites. Effort : 1 h.

- [ ] **Onboarding tour première visite**
      Petit overlay qui explique la sidebar, le filtre, le bouton Run.
      Effort : 2 h.

### 🔵 Long terme (1-3 j)

- [ ] **Déploiement public**
      Front Vercel + backend Railway/Render. URL partageable.
      Effort : 3 h technique + tests.

- [ ] **Authentification + multi-user**
      Chacun sa clé DeepSeek, son historique, ses kernels isolés.
      Effort : 1 j.

- [ ] **Indexer Stack Overflow top answers**
      Élargit le tuteur des « concepts officiels » aux « problèmes réels ».
      Effort : 1 j (parse + filtre + index).

- [ ] **Sandbox Docker** (au lieu de subprocess + audit hook)
      Vrai container isolé. Indispensable si déployé public.
      Effort : 4-6 h.

### 🟣 Idées plus lointaines

- [ ] Connecter à un repo GitHub arbitraire (« indexe mon autre projet »)
- [ ] Mode « tutorat actif » : le bot pose des questions pour vérifier la compréhension
- [ ] Génération de quiz à partir d'une conversation
- [ ] Export d'une conversation en notebook Jupyter exécutable
- [ ] Plugin VS Code qui ouvre le tuteur dans une side panel

---

## 4½. Où vivent physiquement les corpus

Les 13 corpus ne sont pas tous au même endroit sur le disque. Trois familles :

### 🌐 Cloné depuis GitHub (la majorité — 10 corpus)
```
docs-sources/
├── fastapi/        ← github.com/fastapi/fastapi/docs/en/docs
├── pydantic/       ← github.com/pydantic/pydantic/docs
├── typescript/     ← github.com/microsoft/TypeScript-Website/...
├── tailwind/       ← github.com/tailwindlabs/tailwindcss.com/src
├── pytest/         ← github.com/pytest-dev/pytest/doc/en
├── httpx/          ← github.com/encode/httpx/docs
├── sqlalchemy/     ← github.com/sqlalchemy/sqlalchemy/doc/build
├── zod/            ← github.com/colinhacks/zod/packages/docs
├── tanstack-query/ ← github.com/TanStack/query/docs/framework/react
└── vitest/         ← github.com/vitest-dev/vitest/docs
```
**Mise à jour** : `python -m backend.scripts.fetch_docs --corpus <nom>`
ou `python -m backend.scripts.fetch_docs` (tous d'un coup).

### 📦 Shippé avec un package npm (1 corpus — exception Next.js)
```
frontend/node_modules/next/dist/docs/   ← 421 fichiers .md
├── 01-app/          ← App Router
├── 02-pages/        ← Pages Router (legacy)
├── 03-architecture/
└── 04-community/
```
**Pourquoi** : Vercel embarque la doc dans le package npm pour que les
assistants IA lisent la version **exactement alignée** avec celle installée.
**Mise à jour** : `cd frontend && npm update next`.
**Risque** : si tu fais `rm -rf frontend/node_modules`, la doc disparaît
jusqu'au prochain `npm install`.

### 📂 Téléchargé manuellement (1 corpus — exception Python)
```
python-3.14-docs-text/   ← 534 fichiers .txt
├── library/   reference/   tutorial/   howto/
├── faq/       c-api/       whatsnew/   ...
```
**Pourquoi** : la doc Python officielle n'a pas de repo git « plat » facile
à cloner. C'est une archive `.zip` (ou `.tar.bz2`) à télécharger sur
[docs.python.org/3.14/download.html](https://docs.python.org/3.14/download.html)
et à extraire à la racine du projet.
**Mise à jour** : refaire la procédure quand Python 3.15 sort.

### 💻 Ton propre code (1 corpus — `self`)
```
.   ← la racine du projet courant
    (exclusions : node_modules, .next, .cache, chroma_db,
     docs-sources, python-3.14-docs-text, .git, __pycache__, .venv, venv)
```
**Mise à jour** : à chaque `python -m backend.scripts.build_index`,
le corpus `self` reflète l'état du repo à ce moment-là.

---

## 5. Décisions architecturales clés

| Décision | Raison | Date |
|---|---|---|
| **RAG plutôt que fine-tuning** | Mise à jour triviale, traçabilité, anti-hallucination | Phase 0 |
| **ChromaDB local (pas pgvector)** | Zéro setup, fichier local, suffisant single-user | Phase 0 |
| **Migration FastAPI** | Pydantic, OpenAPI auto, middleware standard | Phase 1 |
| **Next.js 16 + Tailwind v4** | Stack moderne, hot-reload, écosystème complet | Phase 1 |
| **Multi-corpus dans la MÊME collection** | Filtrage par `where` ChromaDB plus simple que collections séparées | Phase 2 |
| **DeepSeek-V4-Flash par défaut** | Qualité GPT-4o pour 100× moins cher (~$0.0008/req) | Phase 3 |
| **Audit hook PEP 578 plutôt que Docker** | Suffisant pour usage local, zéro dépendance | Phase 5 |
| **Kernel persistant par conversation** | UX notebook naturelle, pas par message (trop éphémère) | Phase 5 |
| **Conversation id = kernel session id** | Synchro implicite, restart par bouton sur n'importe quel bloc | Phase 5 |
| **Cumul de blocs précédents en fallback** | Si kernel pas dispo, comportement raisonnable conservé | Phase 5 |
| **Next.js : doc lue depuis `node_modules`** | Vercel embarque la doc dans le package npm. Version exactement alignée avec celle installée, mise à jour avec `npm update` | Phase 2 |
| **Python : doc extraite manuellement** | Pas de repo git plat → archive `.zip` depuis docs.python.org. Rare mais propre | Phase 0 |

---

## 6. Si tu reprends après une pause

```powershell
# 1. Démarrer les serveurs
cd C:\Users\konan\Desktop\python_expert

# Terminal 1 : backend
python -m backend.main

# Terminal 2 : frontend
cd frontend ; npm run dev

# Ouvrir http://localhost:3000
```

Si quelque chose ne marche pas, le tableau de dépannage est dans [docs/commands.md](commands.md).

### Pour reprendre le développement

- Pour ajouter un corpus : éditer `backend/corpora.py` + `python -m backend.scripts.fetch_docs --corpus <nom>` + `python -m backend.scripts.build_index`
- Pour modifier le prompt : `backend/prompts.py`
- Pour la sidebar : `frontend/lib/curriculum.ts` (concepts) + `frontend/components/Sidebar.tsx` (rendu)
- Pour le sandbox : `backend/kernel.py` (kernel persistant) + `backend/sandbox.py` (one-shot)

---

## 7. Est-ce un outil **vraiment complet** ?

Réponse honnête : **ça dépend pour qui et pour quoi**.

### ✅ Complet pour : ton apprentissage de développeur web full-stack

Tu as toutes les briques nécessaires pour apprendre, expérimenter, et écrire
du code Python + TypeScript autour de FastAPI + Next.js + Pydantic + Tailwind.
Tu peux travailler offline (Ollama) ou avec qualité max (DeepSeek). Tu peux
exécuter ton code. Tu connais le coût. Tu peux exporter tes apprentissages.
**Rien à ajouter pour ton usage quotidien.**

### ⚠️ Partiellement complet pour : un usage public / produit

Manque pour qu'un autre que toi l'utilise sereinement :

| Manque | Pourquoi c'est nécessaire | Effort |
|---|---|---|
| 🔴 **Sandbox Docker** | L'audit hook PEP 578 est solide pour usage local, pas pour usage public (un user malveillant pourrait épuiser CPU/RAM, ouvrir des connexions réseau) | 4-6 h |
| 🔴 **Authentification** | Sinon n'importe qui sur internet peut consommer ta clé API DeepSeek | 1 j |
| 🔴 **Rate limiting** | Pour ne pas se faire DoS et limiter les coûts | 2 h |
| 🟡 **Monitoring + logs centralisés** | Voir ce qui se passe en production (Sentry, OpenTelemetry) | 4 h |
| 🟡 **Mobile UX correcte** | Aujourd'hui 4/10. Manquant pour partage sur téléphone | 2 h |
| 🟢 **Onboarding** | Premier visiteur ne sait pas quoi faire | 2 h |
| 🟢 **Documentation utilisateur publique** | README OK, manque un site / vidéo | 3 h |

### ❌ Incomplet pour : usages spécialisés

Le tuteur ne couvre pas (et ne doit pas couvrir) :

- **Data science / ML** : pas de NumPy, Pandas, PyTorch, scikit-learn, Polars
- **Backend non-FastAPI** : pas de Django, Flask, Litestar
- **Frontend non-Next** : pas de Vue, Svelte, Solid, Angular
- **Mobile** : pas de React Native, Flutter, Swift, Kotlin
- **DevOps** : pas de Docker, Kubernetes, Terraform, AWS, GCP
- **Bases de données** : pas de PostgreSQL, Redis, MongoDB en profondeur
- **Sécurité offensive** : pas par design (refus politique)

Pour étendre vers un de ces domaines, il suffit d'ajouter une entrée dans
[backend/corpora.py](../backend/corpora.py) et de relancer `fetch_docs` + `build_index`.
Architecture déjà prête.

### 🎯 Conclusion

- **Pour toi qui apprends le web Python+TS moderne** : 🟢 **complet, on peut s'arrêter**
- **Pour montrer dans un portfolio dev** : 🟢 **complet**
- **Pour partager avec quelques amis qui apprennent** : 🟡 **manque auth + mobile + Docker**
- **Pour en faire un SaaS public** : 🟠 **encore 3-5 jours de boulot**
- **Pour couvrir TOUTE la programmation moderne** : 🔴 **ce n'est pas l'objectif et ça ne devrait jamais l'être** — un outil expert sur 6 technos vaut mieux qu'un outil moyen sur 60

---

## 8. Métriques cibles pour la V1.0 publique

| Métrique | Aujourd'hui | Cible V1.0 |
|---|---|---|
| Score retrieval moyen (benchmark 22 questions) | 0.711 | ≥ 0.75 |
| Score FR moyen | 0.639 | ≥ 0.75 |
| Hit rate sur sources attendues | 82% | ≥ 90% |
| Premier token (DeepSeek) | < 1 s | < 0.8 s |
| Sécurité sandbox | 8/8 | 10/10 (ajouter : fork bomb, mémoire, CPU) |
| Mobile UX | 4/10 | 8/10 |
| Onboarding première visite | 0 | tour interactif |
| Lighthouse score | non mesuré | ≥ 90 |
