"""Configuration centrale du pipeline RAG."""
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
DOCS_DIR = PROJECT_ROOT / "python-3.14-docs-text"
CHROMA_DIR = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "python_docs_3_14"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Modèle Ollama local pour la génération de réponses. deepseek-r1:8b est
# un modèle de raisonnement spécialisé code, déjà installé sur la machine.
OLLAMA_MODEL = "qwen2.5-coder:7b"
OLLAMA_URL = "http://localhost:11434/api/generate"

# Nombre de chunks de contexte fournis au LLM. Plus haut = plus de contexte
# mais aussi plus de bruit et plus de tokens à traiter.
TOP_K = 5

# Taille cible des chunks en caractères (≈ 1 token = 4 caractères en moyenne).
# 2000 chars ≈ 500 tokens : assez large pour conserver le contexte d'une
# section, assez petit pour rester précis à la récupération.
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 300

# Taille minimale pour qu'un chunk soit conservé. En dessous, on fusionne
# avec le voisin pour éviter les fragments inutiles (titres orphelins, etc.).
MIN_CHUNK_SIZE = 200
