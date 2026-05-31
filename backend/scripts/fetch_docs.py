"""Récupère / met à jour la doc officielle des corpus distants.

Pour chaque corpus avec ``source_repo`` défini dans backend/corpora.py :
  1. Clone shallow le repo dans un dossier temporaire .cache/repos/<name>/
  2. Copie le sous-dossier ``source_subpath`` vers le ``local_path`` final
  3. Supprime le clone temporaire (économise de la place)

Usage :
    python -m backend.scripts.fetch_docs                  # tous les corpus
    python -m backend.scripts.fetch_docs --corpus fastapi # un seul
    python -m backend.scripts.fetch_docs --list           # liste les corpus
"""
from __future__ import annotations

import argparse
import logging
import shutil
import subprocess
import sys
from pathlib import Path

from ..config import PROJECT_ROOT
from ..corpora import CORPORA, Corpus
from ..logging_config import setup_logging


logger = logging.getLogger(__name__)

REPOS_CACHE = PROJECT_ROOT / ".cache" / "repos"


def fetch_one(corpus: Corpus) -> None:
    """Clone (shallow) le repo du corpus et copie le sous-chemin vers local_path."""
    if corpus.source_repo is None:
        logger.warning("%s : pas de source_repo défini, on ignore (corpus local-only)",
                       corpus.name)
        return

    REPOS_CACHE.mkdir(parents=True, exist_ok=True)
    repo_dir = REPOS_CACHE / corpus.name

    # Si le clone existe déjà, on le supprime pour repartir propre.
    # Pas de `git pull` car c'est shallow et on veut une copie minimale.
    if repo_dir.exists():
        logger.info("[%s] suppression du clone précédent", corpus.name)
        shutil.rmtree(repo_dir, ignore_errors=True)

    branch = corpus.source_branch or "HEAD"
    logger.info("[%s] git clone --depth=1 --branch=%s %s",
                corpus.name, branch, corpus.source_repo)
    cmd = [
        "git", "clone",
        "--depth=1",
        "--branch", branch,
        "--single-branch",
        corpus.source_repo,
        str(repo_dir),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        logger.error("[%s] clone échoué : %s", corpus.name, exc.stderr.strip())
        raise

    # Détermine le sous-chemin à copier.
    if corpus.source_subpath:
        source = repo_dir / corpus.source_subpath
    else:
        source = repo_dir

    if not source.exists():
        raise FileNotFoundError(
            f"[{corpus.name}] sous-chemin '{corpus.source_subpath}' introuvable dans le clone."
        )

    # On efface l'ancien local_path puis on copie.
    if corpus.local_path.exists():
        logger.info("[%s] suppression de l'ancien local_path : %s",
                    corpus.name, corpus.local_path)
        shutil.rmtree(corpus.local_path, ignore_errors=True)

    corpus.local_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("[%s] copie %s → %s", corpus.name, source, corpus.local_path)
    shutil.copytree(source, corpus.local_path)

    # Cleanup du clone temporaire.
    shutil.rmtree(repo_dir, ignore_errors=True)

    # Compte les fichiers indexables.
    file_count = 0
    for ext in corpus.file_extensions:
        file_count += sum(1 for _ in corpus.local_path.rglob(f"*{ext}"))
    logger.info("[%s] prêt : %d fichiers (%s)",
                corpus.name, file_count, ", ".join(corpus.file_extensions))


def list_corpora() -> None:
    print(f"{'Nom':<12} {'Statut':<10} {'Format':<14} {'Description'}")
    print("-" * 70)
    for c in CORPORA.values():
        exists = c.local_path.exists() and any(c.local_path.rglob("*"))
        status = "✓ présent" if exists else "✗ absent"
        remote = " (distant)" if c.is_remote else " (local)"
        print(f"{c.name:<12} {status:<10} {c.format + remote:<14} {c.description}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--corpus", help="Nom d'un seul corpus à récupérer.")
    parser.add_argument("--list", action="store_true",
                        help="Liste les corpus connus et leur statut local.")
    args = parser.parse_args()

    setup_logging("INFO")

    if args.list:
        list_corpora()
        return

    targets: list[Corpus]
    if args.corpus:
        if args.corpus not in CORPORA:
            logger.error("Corpus '%s' inconnu. Lance --list pour voir la liste.",
                         args.corpus)
            sys.exit(1)
        targets = [CORPORA[args.corpus]]
    else:
        targets = [c for c in CORPORA.values() if c.is_remote]

    if not targets:
        logger.warning("Aucun corpus distant à récupérer.")
        return

    logger.info("Récupération de %d corpus...", len(targets))
    for corpus in targets:
        try:
            fetch_one(corpus)
        except Exception as exc:
            logger.error("[%s] échec : %s", corpus.name, exc)
    logger.info("Terminé.")


if __name__ == "__main__":
    main()
