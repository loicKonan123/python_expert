"""Configuration centralisée des logs.

Format unifié, timestamps, niveaux par module, et silence sur les libs
bavardes (huggingface, urllib3) pour garder une sortie lisible.
"""
from __future__ import annotations

import logging
import sys


_LOG_FORMAT = "%(asctime)s [%(levelname)-7s] %(name)-22s %(message)s"
_DATE_FORMAT = "%H:%M:%S"


def setup_logging(level: str = "INFO") -> None:
    """Configure le root logger. À appeler une fois au démarrage."""
    root = logging.getLogger()
    # Réinitialise les handlers (utile en dev / reload).
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT))
    root.addHandler(handler)
    root.setLevel(level.upper())

    # Modules trop bavards par défaut.
    for noisy in (
        "urllib3",
        "httpx",
        "httpcore",
        "huggingface_hub",
        "sentence_transformers",
        "chromadb.segment",
        "chromadb.telemetry",
        "watchfiles",
    ):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Uvicorn aligne son format sur le nôtre.
    for uvi in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(uvi)
        lg.handlers = []
        lg.propagate = True
