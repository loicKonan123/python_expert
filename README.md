# Python Expert — tuteur RAG multi-corpus

Un tuteur de développement web moderne qui répond à tes questions **en s'appuyant
sur la documentation officielle** de 6 technologies, avec citations à la source.

**178 concepts** pré-rédigés répartis en 21 niveaux progressifs sur :
- Python 3.14 · FastAPI · Pydantic · Next.js · TypeScript · Tailwind CSS

**19 821 chunks** indexés depuis les docs officielles (1.5 GB de connaissance brute).

---

## Ce qui le distingue

- **Fidèle à la source** — Chaque affirmation est traçable à un passage de la doc officielle. Pas d'hallucination libre.
- **Multi-tours** avec **query rewriting** automatique (FR ↔ EN) — pose des follow-ups naturels.
- **Conversations** persistées dans le navigateur, exportables en Markdown.
- **Filtre par techno** à la question (« cherche uniquement dans FastAPI »).
- **Sandbox Python** — le tuteur peut **exécuter** son propre code pour vérifier qu'il marche (audit hook PEP 578).
- **Auto-routing** flash/reasoner selon la complexité de la question.
- **Coût en direct** dans le TopBar (~$0.0008 par question avec DeepSeek-V4-Flash).
- **100% local possible** via Ollama, ou via DeepSeek pour la qualité.

---

## Démarrage rapide

### Prérequis

- **Python 3.10+**
- **Node.js 20+**
- **Ollama** ([ollama.com](https://ollama.com)) **OU** une clé API **DeepSeek**
  ([platform.deepseek.com](https://platform.deepseek.com/api_keys))

### 1. Cloner et installer

```powershell
git clone https://github.com/loicKonan123/python_expert.git
cd python_expert

# Dépendances backend
pip install -r backend/requirements.txt

# Dépendances frontend
cd frontend && npm install && cd ..
```

### 2. Configurer

Crée un fichier `.env` à la racine (déjà gitignored) :

```env
# Option A : DeepSeek (recommandé pour la qualité)
PYEXPERT_LLM_PROVIDER=deepseek
PYEXPERT_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
PYEXPERT_DEEPSEEK_MODEL=deepseek-chat

# Option B : Ollama (100% local, gratuit)
# PYEXPERT_LLM_PROVIDER=ollama
# PYEXPERT_OLLAMA_MODEL=qwen2.5-coder:7b
```

### 3. Récupérer les docs et construire l'index

```powershell
# Télécharge les 5 corpus distants (~7 min)
python -m backend.scripts.fetch_docs

# Télécharge aussi la doc Python 3.14 brute depuis docs.python.org
# et extrais l'archive dans ./python-3.14-docs-text/

# Construit l'index vectoriel (~10 min)
python -m backend.scripts.build_index
```

### 4. Lancer (2 terminaux)

```powershell
# Terminal 1 : backend
python -m backend.main

# Terminal 2 : frontend
cd frontend
npm run dev
```

→ Ouvrir http://localhost:3000

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  • Conversations multi-thread + persistance localStorage    │
│  • Filtre corpus, citations cliquables, badges techno       │
│  • Monaco Editor + bouton Run pour blocs Python             │
│  • Streaming SSE, multi-turn, query rewriting               │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP / SSE
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ /api/ask     │  │ /api/run     │  │ /api/usage       │   │
│  │ RAG complet  │  │ Sandbox      │  │ Cost tracking    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ RAG Engine       │    │ LLM Providers                │   │
│  │ - sentence-      │    │ - DeepSeek (cloud)           │   │
│  │   transformers   │    │ - Ollama (local)             │   │
│  │ - ChromaDB       │    │ - Auto-routing flash/reasoner│   │
│  └──────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Corpus documentaires (~15 MB)              │
│  python-3.14-docs-text/   docs-sources/fastapi/             │
│  docs-sources/pydantic/   docs-sources/typescript/          │
│  docs-sources/tailwind/   frontend/node_modules/next/docs   │
└─────────────────────────────────────────────────────────────┘
```

---

## Endpoints HTTP

| Méthode | URL | Rôle |
|---|---|---|
| `POST` | `/api/ask` | Pipeline RAG complet, streaming SSE |
| `POST` | `/api/run` | Exécute du Python dans le sandbox |
| `GET` | `/api/health` | Statut détaillé (modèles, chunks, uptime) |
| `GET` | `/api/usage` | Cumul tokens + coût de la session backend |
| `GET` | `/docs` | Swagger UI auto-généré |
| `GET` | `/redoc` | ReDoc auto-généré |

---

## Structure du code

```
python_expert/
├── backend/
│   ├── main.py                 # App FastAPI + lifespan
│   ├── config.py               # Pydantic Settings (env: PYEXPERT_*)
│   ├── corpora.py              # Manifeste des 6 corpus documentaires
│   ├── chunker.py              # Découpe multi-format (sphinx, markdown, mdx)
│   ├── rag.py                  # RAG Engine (embeddings + ChromaDB)
│   ├── prompts.py              # Système + rewriting
│   ├── routing.py              # Auto-routing flash/reasoner
│   ├── sandbox.py              # Exécution Python sécurisée (audit hook)
│   ├── usage_tracker.py        # Coût + tokens
│   ├── llm_providers/
│   │   ├── ollama.py
│   │   └── deepseek.py
│   ├── routes/                 # /api/ask, /api/run, /api/health, /api/usage
│   └── scripts/
│       ├── fetch_docs.py       # Clone les docs des repos GitHub
│       ├── build_index.py      # Construit ChromaDB
│       └── test_retrieval.py   # Benchmark qualité retrieval
│
├── frontend/                   # Next.js 16 + Tailwind v4 + TypeScript
│   ├── app/page.tsx            # State + orchestration
│   ├── components/
│   │   ├── ChatMessage.tsx     # Bulle + citations cliquables + badges
│   │   ├── CodeBlock.tsx       # Monaco + bouton Run + output sandbox
│   │   ├── ConversationsMenu.tsx # Historique des threads + export MD
│   │   ├── CorpusFilter.tsx    # Chips de filtre par techno
│   │   ├── Sidebar.tsx         # Curriculum 21 niveaux × 178 concepts
│   │   └── TopBar.tsx          # Health, usage live, nouvelle conv
│   └── lib/                    # api.ts, conversations.ts, curriculum.ts
│
├── docs/
│   ├── plan.md                 # Vision, architecture, choix techniques
│   └── commands.md             # Cheatsheet des commandes utiles
│
├── .env.example                # Template (.env est gitignored)
└── README.md
```

---

## Configuration (`.env`)

| Variable | Défaut | Description |
|---|---|---|
| `PYEXPERT_LLM_PROVIDER` | `ollama` | `ollama` ou `deepseek` |
| `PYEXPERT_OLLAMA_MODEL` | `qwen2.5-coder:7b` | Modèle Ollama local |
| `PYEXPERT_DEEPSEEK_API_KEY` | — | Clé API DeepSeek |
| `PYEXPERT_DEEPSEEK_MODEL` | `deepseek-chat` | `deepseek-chat` (V4-Flash) ou `deepseek-reasoner` |
| `PYEXPERT_ENABLE_AUTO_ROUTING` | `false` | Active flash → reasoner pour questions complexes |
| `PYEXPERT_COMPLEXITY_THRESHOLD` | `0.4` | Seuil d'activation du reasoner (0–1) |
| `PYEXPERT_EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Modèle d'embedding |
| `PYEXPERT_TOP_K` | `7` | Nombre de chunks injectés dans le prompt |
| `PYEXPERT_SANDBOX_TIMEOUT_S` | `10.0` | Timeout d'exécution du sandbox |
| `PYEXPERT_LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `PYEXPERT_PORT` | `8000` | Port du backend |

Tous les paramètres sont surchargeables au lancement, sans modifier le code.

---

## Coûts indicatifs (provider DeepSeek-V4-Flash)

| Usage | Coût mensuel approximatif |
|---|---|
| 10 questions / jour | ~$0.25 |
| 30 questions / jour | ~$0.75 |
| 100 questions / jour | ~$2.50 |

Avec **5 $ de crédit** : ~6 000 questions. Voir [Pricing DeepSeek](https://api-docs.deepseek.com/quick_start/pricing).

Avec **Ollama** : gratuit (CPU local, ~10 tok/s).

---

## Sécurité

- `.env` **gitignored**, jamais commit
- Sandbox Python : subprocess isolé, env nettoyé, audit hook PEP 578 qui
  bloque les accès fichiers hors sandbox + subprocess + os.system
- 8/8 tests de sécurité passent (lecture `.env`, hosts, subprocess,
  os.system, ctypes externe, etc.)

---

## Limitations connues

- **Embedding model anglais-seul** par défaut. Le rewriting LLM convertit
  les questions FR en EN, ce qui compense largement. Pour du FR natif,
  passer à `intfloat/multilingual-e5-large` ou `BAAI/bge-m3`.
- **CPU only** par défaut. Le modèle d'embedding et Ollama tournent sur CPU
  pour rester accessibles. Un GPU accélère significativement Ollama.

---

## Crédits

- Documentation Python © [Python Software Foundation](https://www.python.org/), licence PSF
- Documentation FastAPI © Sebastián Ramírez, licence MIT
- Documentation Pydantic © Pydantic Services, licence MIT
- Documentation Next.js © Vercel, licence MIT
- Documentation TypeScript © Microsoft, licence Apache 2.0
- Documentation Tailwind CSS © Tailwind Labs, licence MIT
- Modèles : Hugging Face (sentence-transformers), Alibaba (Qwen), DeepSeek

---

## Licence

Le code de ce projet est sous licence **MIT**. Les documentations indexées
restent sous leur licence d'origine (toutes permissives — voir Crédits).
