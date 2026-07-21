# Amélioration qualité RAG — doc & découpage

> Journal de bord vivant. On coche au fur et à mesure pour ne pas se perdre.
> Démarré le 2026-07-17.

## Le constat (vérifié dans la base ChromaDB)

L'utilisateur demande un « cours complet sur la POO » et reçoit des extraits
minimalistes, sans code, alors que les fichiers locaux sont riches. Diagnostic
en 3 causes **prouvées** (pas supposées) :

1. **Frontmatter YAML stocké comme du contenu.** Le bloc `---\ntitle:…\nms.date:…\n---`
   des docs Microsoft est indexé tel quel. ~1 700 chunks déchet :
   - C# : 821 · ASP.NET : 797 · EF Core : 120
   - Pollue les embeddings + ressort comme « source » vide de sens.

2. **La recherche remonte les survols, pas le code.** Pour la requête POO :
   - `object-oriented/index.md` (vue d'ensemble) = 16 chunks, **0 code** → remonté
   - `tutorials/oop.md` (tuto BankAccount) = 13 chunks, **plein de code** → raté
   - Le code EXISTE mais une requête large trouve le générique.

3. **Les blocs de code sont coupés en deux.** `_split_long_text` tranche sur les
   lignes vides dès qu'une section dépasse 2000 chars → des chunks avec un nombre
   **impair** de ` ``` ` (bloc de code à cheval sur deux chunks).

**Grounding OK** : Polaris ne fabrique pas (prouvé par le test `eval_strategy`).
Mais retrieval faible → il comble avec sa mémoire. Donc : améliorer le retrieval.

## Le plan

| # | Fix | Fichier | Statut |
|---|-----|---------|--------|
| 1 | Retirer le frontmatter YAML avant découpage | `backend/chunker.py` | ✅ |
| 2 | Ne jamais couper à l'intérieur d'un ` ``` ` | `backend/chunker.py` | ✅ |
| — | Tester le chunker sur les fichiers OOP C# | (script) | ✅ |
| — | Ré-indexer les corpus touchés (incrémental) | `build_index` | ✅ |
| 3 | Injecter N fichiers entiers + monter `top_k` | `backend/rag.py`, `config.py` | ✅ |
| 4 | Expansion qui préfère les fichiers riches en code | `backend/rag.py`, `config.py` | ✅ |
| — | Vérif finale : re-poser la question POO | (script) | ✅ |

Légende : ⏳ à faire · 🔄 en cours · ✅ fait

## Résultat final (question POO en C#)

| Métrique | Avant | Après |
|---|---|---|
| Frontmatter déchet dans les sources | majorité | **0** |
| Code de création de classe dans les sources | absent | **`classes.md` §"Define the bank account type" + inheritance.md étendus** |
| Réponse générée | creuse | **6 blocs de code** (classes `Personne`, `CompteBancaire`), cite `classes.md` |
| Chunks totaux dans l'index | 100 962 | 97 721 (−3 241 déchets) |
| Benchmark retrieval (29 Q) | 0.701 / 13-15 hits | **0.702 / 13-15 hits** (pas de régression) |

## Détail des correctifs livrés

**Fix 1 — `_strip_frontmatter()`** : retire le bloc `---\n…\n---` en tête des
fichiers markdown/mdx. Testé : `objects.md` passe de 6 → 5 chunks, le chunk
100 % métadonnée a disparu.

**Fix 2 — `_paragraphs_preserving_code()`** : le découpage des sections longues
ne coupe plus sur une ligne vide SI elle est à l'intérieur d'un bloc ` ``` `.
Bonus : l'overlap de 300c qui recopiait une fence orpheline est neutralisé
quand il contient un nombre impair de ` ``` `. Testé sur csharp/aspnet/
transformers/fastapi : 0 bloc de code coupé.

**Fix 3 — retrieval élargi** :
- `top_k` 7 → **10** (config).
- `expand_top_files = 3` (config) : les 3 meilleurs fichiers distincts sont
  injectés en entier (≤ 12k chars) derrière leur meilleur chunk, au lieu du
  seul top-1. Le LLM lit jusqu'à 3 pages officielles complètes.
- `RetrievedChunk.expanded` distingue les chunks d'expansion des primaires ;
  le boost d'intent (`ask.py`) ne tronque plus que les primaires et conserve
  les expansions des fichiers survivants.

## Journal

- **2026-07-17** — Diagnostic terminé, plan validé. Doc créé.
- **2026-07-17** — Fix 1 + 2 codés et validés sur échantillon. Lancement de la
  ré-indexation des corpus markdown/mdx en arrière-plan.
- **2026-07-17** — Fix 3 codé (retrieval multi-fichiers + top_k 10). Imports OK.
  Reste : fin du re-index puis vérif finale sur la question POO.
- **2026-07-17** — Re-index terminé (97 721 chunks, frontmatter déchet = 0
  partout). Vérif POO : réponse riche en code, mais sources encore dominées
  par les pages de survol → ajout du **Fix 4**.
- **2026-07-17** — Fix 4 : l'expansion privilégie les fichiers au plus gros
  VOLUME de code (pas le nombre de blocs — les pages de survol alignent des
  mini-snippets). `classes.md` (BankAccount) et `inheritance.md` sont désormais
  étendus ; leur code de création de classe apparaît dans les sources.
  Benchmark : pas de régression. **Plan terminé.**

## Idées de finition (non bloquantes, pour plus tard)

- Reste ~50 chunks (0.2 %) avec un ` ``` ` orphelin dans aspnet/efcore
  (sections à multiples blocs) — masqué par l'expansion whole-file, cosmétique.
- Le `prefer_code` fait ~9 lectures ChromaDB de plus par question (négligeable
  vs l'appel LLM, mais optimisable par cache si besoin).
- `expand_prefer_code` est global (config) ; on pourrait le désactiver pour les
  questions purement conceptuelles si jamais ça sur-injecte du code.
