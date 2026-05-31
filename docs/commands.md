# Aide-mémoire — commandes utiles

Toutes les commandes sont en **PowerShell** depuis la racine du projet
(`C:\Users\konan\Desktop\python_expert`).

---

## 🛑 Tout arrêter

Tue n'importe quel processus qui écoute sur les ports backend (8000) et frontend (3000) :

```powershell
foreach ($p in 3000,8000) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }
```

Vérifier que c'est libre :

```powershell
foreach ($p in 3000,8000) { "Port $p : $(if (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) {'occupé'} else {'libre'})" }
```

---

## 🚀 Démarrer

**Backend** (Terminal 1) :

```powershell
python -m backend.main
```

**Frontend** (Terminal 2) :

```powershell
cd frontend
npm run dev
```

→ Ouvrir http://localhost:3000

---

## 🔄 Mettre à jour la doc (corpus)

**Lister les corpus connus** et leur statut local :

```powershell
python -m backend.scripts.fetch_docs --list
```

**Cloner / mettre à jour un corpus distant** (ex. FastAPI) :

```powershell
python -m backend.scripts.fetch_docs --corpus fastapi
```

**Tout récupérer** d'un coup (FastAPI + Pydantic + TypeScript + Tailwind) :

```powershell
python -m backend.scripts.fetch_docs
```

Corpus disponibles : `python`, `fastapi`, `pydantic`, `nextjs`, `typescript`, `tailwind`.

---

## 🏗️ Reconstruire l'index ChromaDB

**Indexer TOUS les corpus actifs** (~10-15 min sur CPU) :

```powershell
python -m backend.scripts.build_index
```

**Indexer un seul corpus** (utile pour debug) :

```powershell
python -m backend.scripts.build_index --corpus fastapi
```

> ⚠️ **À FAIRE APRÈS CHAQUE `build_index`** : redémarrer le backend (Ctrl+C puis relancer).
> Sinon le backend pointe encore sur l'ancienne collection supprimée et tu verras
> `Error getting collection: Collection [...] does not exist`.

---

## 🔍 Inspecter l'état

**Vérifier que le backend répond** :

```powershell
curl http://localhost:8000/
```

**Santé détaillée** (modèles chargés, nombre de chunks, provider LLM) :

```powershell
curl http://localhost:8000/api/health
```

**Cumul tokens + coût depuis le démarrage du backend** :

```powershell
curl http://localhost:8000/api/usage
```

**Doc API interactive (Swagger UI)** : http://localhost:8000/docs

---

## 🔁 Changer de LLM provider

Édite `.env` à la racine :

```env
# Pour utiliser Ollama (local, gratuit, plus lent)
PYEXPERT_LLM_PROVIDER=ollama
PYEXPERT_OLLAMA_MODEL=qwen2.5-coder:7b

# Pour utiliser DeepSeek (API, rapide, ~$0.0008/question)
PYEXPERT_LLM_PROVIDER=deepseek
PYEXPERT_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
PYEXPERT_DEEPSEEK_MODEL=deepseek-chat
```

Puis **redémarre le backend** (Ctrl+C → `python -m backend.main`).

---

## 🔐 Rotation de la clé DeepSeek

Si tu as exposé ta clé (chat, logs, repo), il faut la révoquer :

1. https://platform.deepseek.com/api_keys
2. Bouton « Delete » à côté de la clé compromise
3. « Create new API key »
4. Édite **uniquement** `.env` (jamais le coller dans un chat / commit) :
   ```env
   PYEXPERT_DEEPSEEK_API_KEY=sk-NOUVELLE-CLE
   ```
5. Redémarrer le backend

---

## 📦 Git

**Voir ce qui changerait à un commit** :

```powershell
git status
git diff --stat
```

**Confirmer que `.env` reste bien hors commit** :

```powershell
git check-ignore -v .env
```

(doit afficher `.gitignore:3:.env	.env`)

**Commiter et pousser** :

```powershell
git add .
git commit -m "ton message"
git push
```

---

## 🆘 Dépannage rapide

| Symptôme | Cause probable | Fix |
|---|---|---|
| `Error getting collection: Collection [...] does not exist` | `build_index` a supprimé+recréé la collection pendant que le backend tournait | **Redémarrer le backend** (Ctrl+C, `python -m backend.main`) |
| `WinError 10013` au lancement uvicorn | Port 8000 déjà occupé par un ancien process | Lancer la commande **« 🛑 Tout arrêter »** puis relancer |
| `Échec authentification DeepSeek (HTTP 402)` | Solde DeepSeek à zéro | Recharger sur https://platform.deepseek.com/top_up |
| `Échec authentification DeepSeek (HTTP 401)` | Clé invalide / révoquée | Régénérer une clé et mettre à jour `.env` |
| `Échec du warmup Ollama (...)` | Ollama n'est pas lancé en local | Démarrer l'application Ollama ou `ollama serve` |
| Le frontend dit « Backend hors-ligne » dans la TopBar | Backend pas lancé ou crashé | Vérifier le terminal du backend, relancer `python -m backend.main` |
| Réponses qui hallucinent (score retrieval bas) | Question dans une terminologie qui ne matche pas la doc | Reformuler en anglais avec les mots de la doc officielle (ex. « decorator » plutôt que « décorateur ») |

---

## 🧹 Nettoyage occasionnel

**Supprimer le cache de clones git** (récupéré au prochain `fetch_docs`) :

```powershell
Remove-Item -Recurse -Force .cache
```

**Supprimer un corpus cloné** (sera re-téléchargé au prochain `fetch_docs`) :

```powershell
Remove-Item -Recurse -Force docs-sources\fastapi
```

**Reset complet de l'index vectoriel** (force une reconstruction propre) :

```powershell
Remove-Item -Recurse -Force chroma_db
python -m backend.scripts.build_index
```
