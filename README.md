# Tuteur Python — RAG 100% local

Assistant Python autonome bâti sur la documentation officielle de **Python 3.14**.
Aucune API externe, aucun coût récurrent : tout tourne sur la machine via
**ChromaDB** (base vectorielle), **sentence-transformers** (embeddings) et
**Ollama** (LLM local).

L'interface web propose un **parcours pédagogique progressif** : 7 niveaux,
~60 concepts numérotés, du débutant au Python moderne (async, pattern matching, types).

---

## Stack

| Brique | Outil | Rôle |
|---|---|---|
| Source | 534 fichiers `.txt` de la doc Python 3.14 | Connaissance |
| Chunking | Code maison (`chunker.py`) | Découpe Sphinx-aware avec métadonnées |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | Encodage local CPU |
| Vector store | ChromaDB (persistant local) | Recherche sémantique |
| LLM | Ollama + `qwen2.5-coder:7b` | Génération de réponses |
| Web | Stdlib `http.server` + SSE | Interface streaming |

---

## Architecture

```
question (FR/EN)
        │
        ▼
┌─────────────────────┐
│  embed (MiniLM)     │  ← sentence-transformers, CPU
└─────────────────────┘
        │ vecteur 384d
        ▼
┌─────────────────────┐
│  ChromaDB query     │  ← top-K chunks par similarité cosinus
└─────────────────────┘
        │ top 5 chunks + métadonnées
        ▼
┌─────────────────────┐
│  build prompt       │  ← passages + question + instructions
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Ollama / qwen2.5   │  ← réponse en français, streaming
└─────────────────────┘
        │
        ▼
   réponse + sources
```

---

## Installation

### Prérequis

- **Python 3.10+**
- **Ollama** installé : [ollama.com](https://ollama.com)
- ~6 GB d'espace disque (modèle LLM + embeddings)

### Étapes

```powershell
# 1. Cloner le dépôt
git clone https://github.com/<ton-user>/<ton-repo>.git
cd <ton-repo>

# 2. Installer les dépendances Python
pip install -r requirements.txt

# 3. Télécharger la documentation officielle Python 3.14 en texte brut
#    (à extraire dans ./python-3.14-docs-text/)
#    Source : https://docs.python.org/3.14/download.html
#    Choisir l'archive "Plain text" et extraire le contenu.

# 4. Télécharger le modèle Ollama
ollama pull qwen2.5-coder:7b

# 5. Construire l'index vectoriel (~7-10 min sur CPU)
python build_index.py

# 6. Lancer le serveur web
python server.py
# → Ouvrir http://localhost:8000
```

---

## Utilisation

### Interface web

```powershell
python server.py
```

Ouvre `http://localhost:8000`. Trois manières d'interagir :

1. **Parcours pédagogique** (sidebar) — 7 niveaux progressifs, clique un concept pour envoyer la question pré-rédigée.
2. **Question libre** — tape ta propre question en anglais dans la zone de saisie.
3. **Recherche** — filtre les concepts par mot-clé.

### Ligne de commande

```powershell
python ask.py "How do decorators work?"
python search.py "asyncio task" --k 7
```

`ask.py` fait le pipeline RAG complet. `search.py` ne fait que la récupération (utile pour debug).

---

## Structure du projet

```
.
├── config.py            # Paramètres centralisés (modèles, chemins, chunking)
├── chunker.py           # Segmentation Sphinx-aware des fichiers .txt
├── build_index.py       # Pipeline d'indexation (chunks → embeddings → ChromaDB)
├── search.py            # Test de récupération (sans LLM)
├── ask.py               # Pipeline RAG complet en CLI
├── server.py            # Serveur web HTTP + SSE
├── web/
│   └── index.html       # Interface chat avec parcours pédagogique
├── requirements.txt     # Dépendances Python
└── README.md
```

---

## Personnalisation

### Changer le modèle LLM

Édite `config.py` :

```python
OLLAMA_MODEL = "llama3.2:3b"  # ou tout autre modèle Ollama
```

Modèles testés (du plus rapide au meilleur) :
- `qwen2.5:3b` — très rapide mais qualité limitée
- `qwen2.5-coder:7b` — **recommandé** (équilibre vitesse/qualité)
- `gemma3:27b` — meilleure qualité, beaucoup plus lent sur CPU
- `deepseek-r1:8b` — qualité élevée mais long (modèle de raisonnement)

### Changer les concepts du parcours

Édite le tableau `CURRICULUM` au début du `<script>` dans `web/index.html`.
Structure :

```javascript
{
  num: "1",
  title: "Premiers pas",
  goal: "Comprendre comment Python stocke et manipule les données simples.",
  concepts: [
    { fr: "Variables et types simples",
      obj: "int, float, str, bool, None — la base de tout",
      en: "What are the basic data types in Python..." },
    // ...
  ],
}
```

### Adapter à une autre documentation

Le pipeline est générique. Pour utiliser une autre doc (Django, FastAPI...) :

1. Place les fichiers `.txt` sources dans un dossier
2. Mets à jour `DOCS_DIR` dans `config.py`
3. Adapte les regex de `chunker.py` si la structure diffère
4. Relance `python build_index.py`

---

## Limitations connues

- **Questions en anglais recommandées** — le modèle d'embedding (`all-MiniLM-L6-v2`)
  est anglais-seulement. Une question en français retrouve des passages génériques
  au lieu des bonnes sections techniques. Voir la section *Personnalisation* pour
  remplacer par un embedding multilingue (au prix d'une qualité de récupération
  moindre sur du vocabulaire technique précis).
- **Pas de GPU exploité** — sentence-transformers et Ollama peuvent utiliser un
  GPU si présent, mais le projet est conçu pour fonctionner partout en CPU.
- **Index à reconstruire si on change l'embedding** — les vecteurs ne sont
  comparables qu'avec le modèle qui les a produits.

---

## Crédits

- Documentation Python © Python Software Foundation, sous licence PSF.
- Modèles : Hugging Face (sentence-transformers), Alibaba (Qwen via Ollama).
