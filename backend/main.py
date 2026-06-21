"""Application FastAPI — point d'entrée du backend.

Lancement :
    python -m backend.main
    # ou pour un dev avec reload :
    uvicorn backend.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .kernel import get_manager as get_kernel_manager
from .llm_providers import get_provider
from .logging_config import setup_logging
from .rag import RAGEngine
from .routes import ask, health, run, usage


# Le logger principal du module est configuré au démarrage.
logger = logging.getLogger("backend.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Chargement modèle + warmup Ollama au démarrage, cleanup à l'arrêt."""
    setup_logging(settings.log_level)

    logger.info("=" * 60)
    logger.info("Démarrage du backend Polaris")
    logger.info("=" * 60)
    logger.info("Paramètres :")
    logger.info("  llm_provider       = %s", settings.llm_provider)
    if settings.llm_provider == "ollama":
        logger.info("  ollama_model       = %s", settings.ollama_model)
        logger.info("  ollama_keep_alive  = %s", settings.ollama_keep_alive)
    elif settings.llm_provider == "deepseek":
        logger.info("  deepseek_model     = %s", settings.deepseek_model)
        logger.info("  deepseek_api_key   = %s",
                    "***" if settings.deepseek_api_key else "(NON DÉFINIE)")
    logger.info("  embedding_model    = %s", settings.embedding_model)
    logger.info("  top_k              = %d", settings.top_k)
    logger.info("  chunk_size         = %d (overlap %d)",
                settings.chunk_size, settings.chunk_overlap)
    logger.info("  cors_origins       = %s", settings.cors_origins)
    logger.info("  host:port          = %s:%d", settings.host, settings.port)
    logger.info("  log_level          = %s", settings.log_level)

    t0 = time.perf_counter()
    app.state.rag = RAGEngine()
    app.state.llm = get_provider()
    app.state.started_at = time.time()
    logger.info("RAG engine prêt (total %.1fs)", time.perf_counter() - t0)

    app.state.llm.warmup()

    logger.info("Backend prêt sur http://%s:%d", settings.host, settings.port)
    logger.info("Docs OpenAPI : http://%s:%d/docs", settings.host, settings.port)
    logger.info("=" * 60)

    yield

    # Tue proprement tous les kernels Python persistants avant de quitter.
    logger.info("Arrêt : fermeture de tous les kernels Python...")
    get_kernel_manager().shutdown_all()
    logger.info("Arrêt du backend.")


app = FastAPI(
    title="Polaris API",
    description="Tuteur Python RAG local — backend FastAPI",
    version="0.2.0",
    lifespan=lifespan,
)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logge chaque requête HTTP : méthode, chemin, statut, durée, origine.

    Les endpoints SSE (qui peuvent durer 30s+) sont marqués comme tels
    pour éviter de penser qu'une requête est bloquée.
    """

    _http_logger = logging.getLogger("backend.http")

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        path = request.url.path
        method = request.method
        origin = request.headers.get("origin", "-")

        self._http_logger.info(">>> %s %s (origin=%s)", method, path, origin)

        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            self._http_logger.exception(
                "!!! %s %s ERREUR %.0fms (%s)", method, path, elapsed_ms, exc,
            )
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        is_stream = response.media_type == "text/event-stream"
        marker = " [SSE]" if is_stream else ""
        self._http_logger.info(
            "<<< %s %s %d %.0fms%s", method, path, response.status_code, elapsed_ms, marker,
        )
        return response


# Ordre des middlewares : le DERNIER ajouté est exécuté en PREMIER (LIFO).
# On veut donc ajouter CORS APRÈS le logging pour que le log voie toutes
# les requêtes (y compris les preflight OPTIONS interceptés par CORS).
app.add_middleware(RequestLoggingMiddleware)

# CORS pour autoriser le frontend Next.js sur :3000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Routes
app.include_router(ask.router)
app.include_router(health.router)
app.include_router(usage.router)
app.include_router(run.router)


@app.get("/", tags=["root"])
def root() -> dict:
    """Page racine — vérification rapide que le serveur tourne."""
    return {
        "name": "Polaris API",
        "version": "0.2.0",
        "docs": "/docs",
        "endpoints": {
            "ask": "POST /api/ask",
            "health": "GET /api/health",
        },
    }


def main() -> None:
    """Démarre uvicorn programmatiquement (utilisé par `python -m backend.main`)."""
    # Pré-configure les logs avant que uvicorn ne les écrase.
    setup_logging(settings.log_level)
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        log_config=None,  # on garde notre propre config
        access_log=False,  # on logge nous-mêmes les requêtes pertinentes
    )


if __name__ == "__main__":
    main()
