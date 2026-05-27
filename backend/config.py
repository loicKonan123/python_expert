"""Configuration centralisée du backend.

Utilise Pydantic Settings pour permettre la surcharge par variables
d'environnement (préfixe ``PYEXPERT_``).

Exemples :
    PYEXPERT_OLLAMA_MODEL=llama3.1:8b python -m backend.main
    PYEXPERT_LOG_LEVEL=DEBUG python -m backend.main
    PYEXPERT_PORT=9000 python -m backend.main
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="PYEXPERT_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Chemins ---
    docs_dir: Path = PROJECT_ROOT / "python-3.14-docs-text"
    chroma_dir: Path = PROJECT_ROOT / "chroma_db"

    # --- Index vectoriel ---
    collection_name: str = "python_docs_3_14"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # --- Chunking (utilisé par scripts/build_index.py) ---
    chunk_size: int = 2000
    chunk_overlap: int = 300
    min_chunk_size: int = 200

    # --- LLM ---
    ollama_model: str = "qwen2.5-coder:7b"
    ollama_url: str = "http://localhost:11434/api/generate"
    ollama_keep_alive: str = "30m"
    ollama_temperature: float = 0.2
    ollama_timeout_s: int = 300

    # --- Retrieval ---
    top_k: int = 7

    # --- Serveur ---
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # --- Logs ---
    log_level: str = "INFO"


settings = Settings()
