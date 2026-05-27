# Plan du projet — Tuteur Python RAG

Ce document explique **ce qu'est le projet**, **de quoi il est fait**, **où il en est aujourd'hui**, et **où on l'amène** avec la nouvelle interface Next.js.

---

## 1. Qu'est-ce que c'est ?

Un **tuteur Python** qui répond à tes questions en s'appuyant sur la documentation officielle de Python 3.14. Tout tourne en local — pas d'API payante, pas de dépendance externe, pas de fuite de données.

### Le problème qu'il résout

Quand tu apprends Python, tu cherches partout : Stack Overflow, des tutos vieillis, des blogs approximatifs. La doc officielle est la source la plus fiable mais elle est **dense** et difficile à explorer quand on cherche une explication pédagogique.

Le tuteur résout ça en deux temps :
1. Il **trouve** automatiquement les bons passages de la doc officielle pour ta question
2. Il les **explique** en français avec un LLM local

### Ce qui le distingue

- **Fidèle à la source** : il cite toujours les passages utilisés
- **Pas d'hallucinations** : le modèle ne « se souvient pas » de Python, il **lit** la doc à chaque question
- **100% autonome** : aucune API externe — coût zéro, vie privée totale
- **Parcours pédagogique intégré** : 7 niveaux progressifs, ~60 concepts numérotés

---

## 2. De quoi c'est composé ?

Le projet a **trois grandes briques** :

### Brique A — La connaissance (les données)
La documentation officielle Python 3.14 en texte brut : 534 fichiers répartis en `library/`, `tutorial/`, `reference/`, `howto/`, `faq/`, `c-api/`, `whatsnew/`, etc. ~15 MB au total. C'est la **vérité** sur laquelle le tuteur s'appuie.

### Brique B — Le moteur RAG (Python, le cerveau)
*Retrieval-Augmented Generation* : le LLM ne connaît pas la doc par cœur, on lui montre les bons passages avant chaque réponse.

1. **Chunker** — découpe les 534 fichiers en ~10 899 morceaux cohérents.
2. **Embedding** — chaque chunk → vecteur 384 dim. Modèle : `sentence-transformers/all-MiniLM-L6-v2`.
3. **Base vectorielle** — ChromaDB stocke les vecteurs (`./chroma_db/`). Une question est elle aussi encodée puis comparée par similarité cosinus.
4. **LLM** — Ollama fait tourner `qwen2.5-coder:7b` localement. Reçoit les 5 chunks + la question, rédige en streaming.

### Brique C — L'interface (le visage)
**Deux interfaces vont coexister** durant la transition :

- **Version actuelle** (`server.py` + `web/index.html`) : conservée tant que la version Next.js n'est pas validée
- **Version Next.js** (`frontend/`) : la nouvelle interface moderne, design soigné, Monaco Editor pour le code, en cours de construction

Plus tard, la version actuelle sera retirée et seule la version Next.js restera.

---

## 3. Où on en est aujourd'hui

### Ce qui fonctionne

- Pipeline RAG complet et validé (score retrieval 0.7+ sur questions Python typiques)
- Interface web actuelle opérationnelle (parcours 7 niveaux × ~60 concepts, streaming SSE)
- Publié sur GitHub : https://github.com/loicKonan123/python_expert

### Ce qui va changer

| Élément | Avant | Après |
|---|---|---|
| Frontend | HTML/CSS/JS dans un seul fichier | **Next.js 14 + Tailwind + TypeScript** |
| Coloration syntaxique du code | Aucune | **Monaco Editor** (même qu'in VS Code) |
| Composants visuels | Basiques | **Composants React typés**, SVG personnalisés |
| Style visuel | Sobre maison | Design system **DESIGN.md** (palette navy + accents Python) |
| Typographie | System fonts | **Geist** (UI) + **JetBrains Mono** (code) |
| Backend | Stdlib `http.server` | **Inchangé pour l'instant** (juste ajout de CORS pour Next.js) |

---

## 4. Plan technique — Architecture Next.js + Python

### Vue d'ensemble

```
┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│  Next.js (port 3000)             │       │  Python backend (port 8000)      │
│  ┌────────────────────────────┐  │       │  ┌────────────────────────────┐  │
│  │ UI moderne (Tailwind +     │  │       │  │ server.py                  │  │
│  │   composants React)        │  │       │  │  - retrieval (ChromaDB)    │  │
│  │ Monaco Editor              │  │ HTTP  │  │  - LLM via Ollama          │  │
│  │ SSE streaming consumer     │ ─┼───────┼─▶│  - streaming SSE           │  │
│  │ Lecture concepts (JSON)    │  │       │  │  + CORS activé             │  │
│  └────────────────────────────┘  │       │  └────────────────────────────┘  │
└──────────────────────────────────┘       └──────────────────────────────────┘
                                                          │
                                                          ▼
                                              ChromaDB + Ollama (locaux)
```

### Pourquoi cette architecture ?

- **Python reste le cerveau** : il a déjà toutes les briques ML/RAG, inutile de tout refaire en JS.
- **Next.js fait l'UI** : composants, routing, Monaco, animations — sa spécialité.
- **Pendant la transition** : la version actuelle (web/index.html servi par server.py) continue de tourner, on peut comparer en parallèle.
- **Au final** : on retire `web/index.html` et `server.py` ne servira plus que l'API JSON / SSE. Next.js sera servi en standalone ou packagé statiquement.

### Structure cible

```
python_expert/
├── (existant — inchangé pendant la transition)
│   ├── server.py             # +CORS pour autoriser Next.js
│   ├── config.py, chunker.py, build_index.py, ask.py, search.py
│   └── web/index.html        # Ancienne UI, retirée plus tard
│
├── frontend/                 # ← NOUVEAU : application Next.js
│   ├── app/
│   │   ├── layout.tsx        # Layout racine + polices Geist/JetBrains Mono
│   │   ├── page.tsx          # Page principale (chat + sidebar)
│   │   └── globals.css       # Tailwind base + tokens DESIGN.md
│   ├── components/
│   │   ├── Sidebar.tsx       # Sidebar curriculum
│   │   ├── TopBar.tsx        # En-tête (statut Ollama, theme toggle)
│   │   ├── ChatMessage.tsx   # Bulle user / IA
│   │   ├── CodeBlock.tsx     # Wrapper Monaco Editor
│   │   ├── Sources.tsx       # Chips de citations
│   │   └── ChatInput.tsx     # Input glassmorphique
│   ├── lib/
│   │   ├── api.ts            # fetch + SSE vers backend Python
│   │   ├── curriculum.ts     # Données du parcours (60 concepts)
│   │   └── markdown.ts       # Rendu markdown léger
│   ├── public/icons/         # SVG personnalisés
│   ├── tailwind.config.ts    # Tokens depuis DESIGN.md
│   ├── tsconfig.json
│   ├── next.config.js
│   └── package.json
│
└── docs/
    └── plan.md
```

### Stack Next.js

- **Next.js 14** (App Router, pas Pages Router)
- **TypeScript** (typage solide)
- **Tailwind CSS** (compatible avec le `code.html` de référence)
- **Monaco Editor** via `@monaco-editor/react` (chargement dynamique pour ne pas alourdir le bundle initial)
- **Geist** + **JetBrains Mono** via `next/font/google`
- **Material Symbols** ou icônes SVG custom (à arbitrer)

### Modifications du backend

Une seule, minimale : ajouter des en-têtes CORS dans `server.py` pour autoriser les requêtes depuis `http://localhost:3000`.

Pas de migration FastAPI pour l'instant — le serveur stdlib actuel suffit largement. FastAPI restera une option pour plus tard si on en a besoin (auth, openapi, multi-users).

---

## 5. Ordre d'exécution

1. **Scaffold Next.js** dans `frontend/`
2. **Configuration Tailwind** avec les tokens de DESIGN.md (couleurs, polices, espacements)
3. **Composants de base** matchant le `code.html` de référence (Sidebar, TopBar, Chat, Input)
4. **Intégration Monaco** pour les blocs de code générés
5. **Câblage API** : appel SSE vers `http://localhost:8000/ask`
6. **CORS** dans `server.py`
7. **Test end-to-end** avec les deux serveurs en parallèle (Python `:8000`, Next.js `:3000`)
8. **Commit + push** par étapes

À chaque étape, commit séparé.

---

## 6. Pour lancer après la migration

```powershell
# Terminal 1 : backend Python
python server.py

# Terminal 2 : frontend Next.js
cd frontend
npm install   # première fois seulement
npm run dev   # ouvre http://localhost:3000
```

Les deux versions coexistent jusqu'à validation finale.

---

## 7. Questions à trancher (en cours de route)

1. **Monaco Editor** : lecture seule (afficher proprement le code généré), ou éditable (l'utilisateur peut modifier et te demander d'expliquer) ? *Default : lecture seule.*
2. **Icônes** : Material Symbols (comme `code.html`) ou SVG personnalisés que tu fournis ? *Default : Material Symbols + quelques SVG custom pour les éléments distinctifs.*
3. **Curriculum** : on le garde en TypeScript côté frontend, ou tu veux qu'on l'expose via une route API ? *Default : côté frontend, c'est plus simple.*
4. **Theme switcher** : sombre uniquement, ou clair + sombre ? *Default : sombre uniquement comme dans le template.*

Je n'ai pas besoin de ces réponses pour démarrer — je prends les defaults sauf si tu m'arrêtes.
