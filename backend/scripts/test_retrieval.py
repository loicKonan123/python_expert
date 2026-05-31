"""Benchmark de la qualité du retrieval sur un jeu de questions.

Mesure pour chaque question :
  - top_score (similarité cosinus du meilleur chunk)
  - les top-3 sources retournées
  - si la source attendue (corpus + path partiel) est dans le top-K

Sort un rapport tableau + stats (moyenne, médiane, distribution par bucket
de qualité).

Usage :
    python -m backend.scripts.test_retrieval                # toutes les questions
    python -m backend.scripts.test_retrieval --k 7         # autre top-K
    python -m backend.scripts.test_retrieval --json out.json # export JSON
"""
from __future__ import annotations

import argparse
import json
import statistics
from dataclasses import asdict, dataclass
from typing import Optional

from ..config import settings
from ..logging_config import setup_logging
from ..rag import RAGEngine


@dataclass
class TestCase:
    """Une question + (optionnel) l'extrait de source attendu."""
    query: str
    category: str  # "EN-easy", "EN-medium", "EN-hard", "FR"
    expected_corpus: Optional[str] = None
    expected_path_contains: Optional[str] = None


# ----------------------------------------------------------------------------
# Jeu de tests représentatif (étendable)
# ----------------------------------------------------------------------------
TESTS: list[TestCase] = [
    # ============ EN faciles (réponse précise, vocabulaire de la doc) ============
    TestCase("How do Python decorators work and the @decorator syntax",
             "EN-easy", "python", "reference/compound_stmts"),
    TestCase("How do Python dataclasses work with frozen and field()",
             "EN-easy", "python", "library/dataclasses"),
    TestCase("How does Python asyncio gather work for concurrent tasks",
             "EN-easy", "python", "library/asyncio"),
    TestCase("FastAPI dependencies with Depends function injection",
             "EN-easy", "fastapi", "tutorial/dependencies"),
    TestCase("Pydantic field validators and model_validator decorator",
             "EN-easy", "pydantic", "concepts/validators"),
    TestCase("Next.js App Router layout.tsx and nested layouts",
             "EN-easy", "nextjs", "layouts"),
    TestCase("TypeScript generic type constraints with extends",
             "EN-easy", "typescript", "handbook"),
    TestCase("Tailwind responsive design with sm md lg breakpoints",
             "EN-easy", "tailwind", None),

    # ============ EN intermédiaires (un mot-clé moins évident) ============
    TestCase("How do I read and parse JSON files in Python",
             "EN-medium", "python", "library/json"),
    TestCase("FastAPI background tasks running after response",
             "EN-medium", "fastapi", "background-tasks"),
    TestCase("Pydantic Settings reading environment variables and .env",
             "EN-medium", "pydantic", None),
    TestCase("Next.js Server Actions and use server form mutations",
             "EN-medium", "nextjs", None),
    TestCase("TypeScript discriminated unions for type narrowing",
             "EN-medium", "typescript", None),
    TestCase("Tailwind dark mode strategy class vs media",
             "EN-medium", "tailwind", None),

    # ============ EN durs (questions larges/abstraites) ============
    TestCase("What are the basic data types in Python",
             "EN-hard", "python", None),
    TestCase("How do I structure a FastAPI project",
             "EN-hard", "fastapi", None),
    TestCase("How do I organize a Next.js project",
             "EN-hard", "nextjs", None),
    TestCase("What are TypeScript best practices for typing",
             "EN-hard", "typescript", None),

    # ============ FR (test de la limite anglais-seul) ============
    TestCase("Comment fonctionne un décorateur Python avec exemple",
             "FR", "python", "reference/compound_stmts"),
    TestCase("FastAPI authentification JWT et OAuth2",
             "FR", "fastapi", "security"),
    TestCase("TypeScript types génériques et contraintes",
             "FR", "typescript", None),
    TestCase("Comment utiliser Pydantic pour valider du JSON",
             "FR", "pydantic", None),
]


@dataclass
class Result:
    query: str
    category: str
    top_score: float
    avg_top_3: float
    expected_corpus: Optional[str]
    actual_corpora: list[str]
    expected_path_contains: Optional[str]
    expected_hit: Optional[bool]  # None si pas d'attendu spécifié
    top_3_paths: list[str]
    quality: str  # "excellent" | "bon" | "moyen" | "faible"


def quality_bucket(score: float) -> str:
    if score >= 0.70:
        return "excellent"
    if score >= 0.55:
        return "bon"
    if score >= 0.45:
        return "moyen"
    return "faible"


def run_one(rag: RAGEngine, test: TestCase, k: int) -> Result:
    chunks = rag.retrieve(test.query, k=k)
    top_score = chunks[0].score if chunks else 0.0
    top_3_scores = [c.score for c in chunks[:3]]
    avg_top_3 = sum(top_3_scores) / len(top_3_scores) if top_3_scores else 0.0
    top_3_paths = [f"{c.corpus}/{c.source}" for c in chunks[:3]]
    actual_corpora = list({c.corpus for c in chunks})

    expected_hit: Optional[bool] = None
    if test.expected_path_contains is not None:
        expected_hit = any(
            test.expected_path_contains in c.source
            and (test.expected_corpus is None or c.corpus == test.expected_corpus)
            for c in chunks
        )

    return Result(
        query=test.query,
        category=test.category,
        top_score=top_score,
        avg_top_3=avg_top_3,
        expected_corpus=test.expected_corpus,
        actual_corpora=actual_corpora,
        expected_path_contains=test.expected_path_contains,
        expected_hit=expected_hit,
        top_3_paths=top_3_paths,
        quality=quality_bucket(top_score),
    )


def print_report(results: list[Result], *, embedding_model: str) -> None:
    """Imprime un tableau lisible + résumé."""
    print()
    print("=" * 100)
    print(f"BENCHMARK RETRIEVAL — modèle d'embedding : {embedding_model}")
    print("=" * 100)
    print(f"{'Catégorie':<11} {'Top':>5} {'Avg3':>5} {'Hit':>4}  Question")
    print("-" * 100)

    by_cat: dict[str, list[Result]] = {}
    for r in results:
        by_cat.setdefault(r.category, []).append(r)

    for cat in ("EN-easy", "EN-medium", "EN-hard", "FR"):
        cat_results = by_cat.get(cat, [])
        for r in cat_results:
            hit = ""
            if r.expected_hit is True:
                hit = "✓"
            elif r.expected_hit is False:
                hit = "✗"
            q = r.query if len(r.query) <= 70 else r.query[:67] + "..."
            print(f"{cat:<11} {r.top_score:>5.3f} {r.avg_top_3:>5.3f} {hit:>4}  {q}")
        if cat_results:
            print()

    # Sommaire
    print("=" * 100)
    print("STATISTIQUES GLOBALES")
    print("-" * 100)
    all_scores = [r.top_score for r in results]
    print(f"Questions testées        : {len(results)}")
    print(f"Score moyen              : {statistics.mean(all_scores):.3f}")
    print(f"Score médian             : {statistics.median(all_scores):.3f}")
    print(f"Score min / max          : {min(all_scores):.3f} / {max(all_scores):.3f}")
    print()
    print("Distribution par qualité :")
    for bucket in ("excellent", "bon", "moyen", "faible"):
        count = sum(1 for r in results if r.quality == bucket)
        pct = 100 * count / len(results)
        marker = {"excellent": "🟢", "bon": "🟢", "moyen": "🟡", "faible": "🔴"}[bucket]
        print(f"  {marker} {bucket:<10} : {count:>2} ({pct:>4.0f}%)")
    print()
    print("Par catégorie :")
    for cat in ("EN-easy", "EN-medium", "EN-hard", "FR"):
        cat_scores = [r.top_score for r in results if r.category == cat]
        if not cat_scores:
            continue
        avg = statistics.mean(cat_scores)
        emoji = "🟢" if avg >= 0.6 else "🟡" if avg >= 0.45 else "🔴"
        print(f"  {emoji} {cat:<10} : moyenne {avg:.3f}  (sur {len(cat_scores)} questions)")
    print()

    # Hits attendus (subset où expected_path_contains est défini)
    with_expected = [r for r in results if r.expected_hit is not None]
    if with_expected:
        hits = sum(1 for r in with_expected if r.expected_hit)
        pct = 100 * hits / len(with_expected)
        print(f"Pertinence ciblée       : {hits}/{len(with_expected)} hits "
              f"({pct:.0f}%) — la source attendue est dans le top-K")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--k", type=int, default=settings.top_k,
                        help=f"Top-K à récupérer (défaut : {settings.top_k}).")
    parser.add_argument("--json", help="Exporter aussi en JSON.")
    args = parser.parse_args()

    setup_logging("WARNING")  # on garde la console clean pendant le bench
    print("Chargement du moteur RAG...")
    rag = RAGEngine()
    print(f"Prêt. Benchmark sur {len(TESTS)} questions, k={args.k}.\n")

    results: list[Result] = []
    for i, t in enumerate(TESTS, 1):
        print(f"[{i}/{len(TESTS)}] {t.query[:80]}...", end="\r")
        results.append(run_one(rag, t, args.k))
    print(" " * 100, end="\r")  # efface la ligne courante

    print_report(results, embedding_model=settings.embedding_model)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)
        print(f"Export JSON : {args.json}")


if __name__ == "__main__":
    main()
