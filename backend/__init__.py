"""Tuteur Python — backend FastAPI.

Architecture :
  - main.py : application FastAPI + lifespan (chargement modèle, warmup Ollama)
  - config.py : paramètres centralisés (Pydantic Settings)
  - logging_config.py : configuration des logs
  - rag.py : moteur de récupération (embeddings + ChromaDB)
  - ollama_client.py : appel au LLM local Ollama
  - prompts.py : prompts système
  - chunker.py : segmentation des fichiers .txt de la doc
  - routes/ : endpoints HTTP
  - scripts/ : outils CLI (build_index)
"""

__version__ = "0.2.0"
