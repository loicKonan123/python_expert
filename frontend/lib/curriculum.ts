/**
 * Curriculum progressif — 7 niveaux, ~60 concepts numérotés.
 * L'ordre dans chaque niveau respecte les prérequis : aucun concept ne suppose
 * de connaissance d'un concept ultérieur.
 *
 * Chaque concept porte sa question anglaise pré-rédigée envoyée au backend.
 */

export type Concept = {
  /** Libellé court en français (ex: "Décorateurs") */
  fr: string;
  /** Objectif d'apprentissage (sous-titre court) */
  obj: string;
  /** Question anglaise envoyée au backend RAG */
  en: string;
};

export type Level = {
  /** Numéro du niveau (1..7) — sert aussi de clé visuelle */
  num: string;
  /** Titre court */
  title: string;
  /** Objectif d'apprentissage du niveau */
  goal: string;
  /** Icône Material Symbols pour la sidebar */
  icon: string;
  concepts: Concept[];
};

export const CURRICULUM: Level[] = [
  {
    num: "1",
    title: "Premiers pas",
    goal: "Comprendre comment Python stocke et manipule les données simples.",
    icon: "terminal",
    concepts: [
      { fr: "Variables et types simples", obj: "int, float, str, bool, None — la base de tout",
        en: "What are the basic data types in Python (int, float, str, bool, None) and how does variable assignment work? Give simple examples." },
      { fr: "Opérateurs", obj: "Arithmétiques, comparaison, logiques",
        en: "What are the arithmetic, comparison, and logical operators in Python? Show their precedence and examples." },
      { fr: "Chaînes de caractères", obj: "Concaténation, indexation, slicing, méthodes",
        en: "How do strings work in Python? Show indexing, slicing, and common methods like upper, lower, strip, split, replace, find." },
      { fr: "f-strings (introduction)", obj: "Insérer des variables dans du texte",
        en: "How do f-strings work in Python for basic string formatting? Show variable insertion and simple expressions inside braces." },
      { fr: "Entrée / sortie", obj: "print() et input() pour interagir",
        en: "How do print() and input() work in Python? Show keyword arguments of print (sep, end, file) and reading user input." },
      { fr: "Conditions if / elif / else", obj: "Faire des choix",
        en: "How do if, elif, and else conditions work in Python? Show truthy/falsy values and nested conditions with examples." },
      { fr: "Boucles while", obj: "Répéter tant qu'une condition tient",
        en: "How does the while loop work in Python? Show break, continue, and the else clause with examples." },
      { fr: "Boucles for et range()", obj: "Itérer sur une séquence",
        en: "How does the for loop work in Python with range() and enumerate()? Show examples with break, continue, and else." },
      { fr: "Listes", obj: "Collection ordonnée et modifiable",
        en: "How do lists work in Python? Show creation, indexing, slicing, and methods: append, extend, insert, pop, remove, sort, reverse." },
      { fr: "Tuples", obj: "Collection ordonnée immuable",
        en: "What are tuples in Python and when should I use them instead of lists? Show packing, unpacking, and named tuples." },
      { fr: "Dictionnaires", obj: "Paires clé-valeur",
        en: "How do dictionaries work in Python? Show creation, access, iteration, and methods: keys, values, items, get, update, pop." },
      { fr: "Ensembles (sets)", obj: "Collection sans doublons",
        en: "What are sets in Python? Show creation, the operations union, intersection, difference, symmetric_difference, and frozen sets." },
    ],
  },
  {
    num: "2",
    title: "Structurer son code",
    goal: "Organiser ton code en fonctions, modules, et gérer les erreurs.",
    icon: "rebase_edit",
    concepts: [
      { fr: "Définir une fonction", obj: "def, paramètres, return",
        en: "How do I define and call functions in Python? Show parameters, return values, and docstrings with examples." },
      { fr: "Paramètres par défaut", obj: "Valeurs par défaut et arguments nommés",
        en: "How do default parameter values and keyword arguments work in Python functions? Show the mutable default argument trap." },
      { fr: "*args et **kwargs", obj: "Nombre variable d'arguments",
        en: "What are *args and **kwargs in Python function definitions? Show packing/unpacking and forwarding arguments." },
      { fr: "Portée des variables", obj: "local, global, nonlocal",
        en: "How does variable scope work in Python? Explain LEGB rule, global and nonlocal keywords with examples." },
      { fr: "Fonctions lambda", obj: "Petites fonctions anonymes",
        en: "What are lambda functions in Python and when should I use them? Show usage with sorted, map, filter." },
      { fr: "Modules et imports", obj: "Organiser le code en fichiers",
        en: "How do Python modules and imports work? Explain import, from/import, as, __name__, __main__, and the import system." },
      { fr: "Gestion d'erreurs", obj: "try / except / finally / raise",
        en: "How do try, except, finally, else, and raise work in Python? Show common exception types and creating custom exceptions." },
      { fr: "Lire et écrire des fichiers", obj: "open(), read, write, modes",
        en: "How do I read and write files in Python with open()? Show modes (r, w, a, b), text vs binary, and best practices." },
      { fr: "Context managers (with)", obj: "Gérer des ressources proprement",
        en: "How do context managers and the with statement work in Python? Show file handling and writing custom context managers with __enter__/__exit__ and contextlib." },
    ],
  },
  {
    num: "3",
    title: "Style pythonique",
    goal: "Écrire du code Python idiomatique, concis et expressif.",
    icon: "auto_awesome",
    concepts: [
      { fr: "Compréhensions de listes", obj: "[x*2 for x in items if x > 0]",
        en: "What are list comprehensions in Python? Show simple, conditional, and nested examples vs equivalent for loops." },
      { fr: "Compréhensions dict et set", obj: "Variantes pour dict et set",
        en: "How do dictionary and set comprehensions work in Python? Show practical examples with conditions." },
      { fr: "Le protocole d'itération", obj: "__iter__ et __next__",
        en: "What is the iterator protocol in Python? Show __iter__, __next__, StopIteration, and writing a custom iterator class." },
      { fr: "Générateurs et yield", obj: "Produire des valeurs paresseusement",
        en: "What are generators and the yield keyword in Python? Show generator functions, generator expressions, and yield from." },
      { fr: "Closures", obj: "Fonctions qui capturent leur contexte",
        en: "What are closures in Python? Show how inner functions capture variables from enclosing scopes with examples." },
      { fr: "Décorateurs (introduction)", obj: "Modifier une fonction avec @",
        en: "How do Python decorators work? Show the @decorator syntax with a simple example like a logger or timer." },
      { fr: "Décorateurs avec arguments", obj: "@decorator(param) — niveau supplémentaire",
        en: "How do I write decorators that accept arguments in Python? Show the three-level function pattern with examples." },
      { fr: "map, filter, reduce", obj: "Style fonctionnel",
        en: "How do map, filter, and reduce work in Python? Show examples and compare with list comprehensions." },
      { fr: "f-strings avancés", obj: "Format spec : alignement, padding, précision",
        en: "How do f-strings work with advanced formatting in Python? Show alignment, width, padding, number precision, !r/!s/!a, and = for debugging." },
    ],
  },
  {
    num: "4",
    title: "Programmation orientée objet",
    goal: "Modéliser ton domaine avec des classes et l'héritage.",
    icon: "architecture",
    concepts: [
      { fr: "Classes et instances", obj: "class, self, créer un objet",
        en: "How do classes work in Python? Show class definition, instance creation, and the role of self." },
      { fr: "__init__ et attributs", obj: "Initialiser un objet",
        en: "How does __init__ work in Python classes? Show instance attributes vs class attributes with examples." },
      { fr: "Méthodes de classe et statiques", obj: "@classmethod et @staticmethod",
        en: "What is the difference between instance methods, @classmethod, and @staticmethod in Python? Show when to use each." },
      { fr: "__str__ et __repr__", obj: "Représentation textuelle d'un objet",
        en: "What are __str__ and __repr__ in Python? Show the difference, when each is called, and best practices." },
      { fr: "__eq__, __hash__, __lt__", obj: "Comparer des objets",
        en: "How do __eq__, __hash__, __lt__, __le__, __gt__, __ge__ work in Python? Show how to make objects comparable and hashable." },
      { fr: "__len__, __getitem__, __iter__", obj: "Faire un objet container",
        en: "How do __len__, __getitem__, __setitem__, __contains__, and __iter__ work in Python? Show building a custom container class." },
      { fr: "Héritage simple", obj: "class B(A) et super()",
        en: "How does class inheritance work in Python? Show single inheritance, super(), method overriding with examples." },
      { fr: "Héritage multiple et MRO", obj: "Plusieurs parents et l'ordre de résolution",
        en: "How does multiple inheritance work in Python? Explain the MRO (Method Resolution Order), the C3 linearization, and the diamond problem." },
      { fr: "@property", obj: "Attributs calculés, getters/setters",
        en: "How does @property work in Python? Show getters, setters, deleters, and how it replaces explicit accessors." },
      { fr: "Classes abstraites (ABC)", obj: "Forcer une interface dans les sous-classes",
        en: "How do abstract base classes work in Python with the abc module? Show ABC, abstractmethod, and ABCMeta." },
      { fr: "Dataclasses", obj: "Générer __init__, __repr__, __eq__ automatiquement",
        en: "How do dataclasses work in Python and what does the @dataclass decorator provide? Show frozen, default values, field(), and post_init." },
    ],
  },
  {
    num: "5",
    title: "Types et patterns modernes",
    goal: "Adopter les fonctionnalités récentes de Python (3.10+).",
    icon: "psychology",
    concepts: [
      { fr: "Type hints basiques", obj: "Annoter paramètres et retours",
        en: "How do basic type hints work in Python? Show annotating function parameters, return types, and variables with simple types." },
      { fr: "typing : Optional, Union, List...", obj: "Types composés et génériques",
        en: "How does the typing module work in Python? Show Optional, Union, List, Dict, Tuple, Callable, TypeVar, and Generic." },
      { fr: "Type unions modernes (X | Y)", obj: "Syntaxe Python 3.10+",
        en: "How does the X | Y union syntax work for type hints in Python 3.10+? Compare with typing.Union and Optional." },
      { fr: "TypedDict et Protocol", obj: "Typer les dicts et le duck-typing",
        en: "What are TypedDict and Protocol in Python typing? Show structural subtyping examples and use cases." },
      { fr: "Pattern matching (match/case)", obj: "Filtrer par structure (3.10+)",
        en: "How does the match/case statement work in Python 3.10+? Show literal, capture, class, sequence, mapping, and guard patterns." },
      { fr: "Walrus operator (:=)", obj: "Assigner dans une expression",
        en: "What is the walrus operator (:=) in Python? Show use cases in while loops, list comprehensions, and conditions." },
      { fr: "Métaclasses", obj: "Classes qui créent des classes",
        en: "What are metaclasses in Python and how do they work? Show type() as a metaclass, the metaclass= argument, and __init_subclass__." },
    ],
  },
  {
    num: "6",
    title: "Concurrence et I/O",
    goal: "Faire plusieurs choses en parallèle, gérer l'asynchrone.",
    icon: "alt_route",
    concepts: [
      { fr: "Threading et le GIL", obj: "Plusieurs threads, le verrou global",
        en: "How does threading work in Python? Show Thread, Lock, RLock, and explain the GIL and its implications for CPU vs I/O bound tasks." },
      { fr: "Multiprocessing", obj: "Vrai parallélisme, contourner le GIL",
        en: "How does multiprocessing work in Python? Show Process, Pool, Queue, and inter-process communication." },
      { fr: "async / await (introduction)", obj: "Coroutines et asyncio.run",
        en: "How do async/await and the basics of asyncio work in Python? Show defining coroutines, awaiting them, and running with asyncio.run." },
      { fr: "asyncio avancé", obj: "Tasks, gather, timeouts",
        en: "How does asyncio handle concurrent operations in Python? Show Tasks, asyncio.gather, semaphores, timeouts, and TaskGroup (3.11+)." },
      { fr: "subprocess", obj: "Lancer d'autres programmes",
        en: "How does the subprocess module work in Python? Show subprocess.run, capturing stdout/stderr, Popen, and shell vs list arguments." },
    ],
  },
  {
    num: "7",
    title: "Bibliothèque standard essentielle",
    goal: "Maîtriser les modules incontournables — « batteries included ».",
    icon: "library_books",
    concepts: [
      { fr: "collections", obj: "Counter, defaultdict, deque, namedtuple",
        en: "What does the collections module provide in Python? Show Counter, defaultdict, deque, namedtuple, OrderedDict with examples." },
      { fr: "itertools", obj: "Outils d'itération efficaces",
        en: "What does the itertools module provide in Python? Show chain, cycle, count, combinations, permutations, groupby, product, accumulate, takewhile." },
      { fr: "functools", obj: "Outils pour fonctions",
        en: "What does functools provide in Python? Show partial, reduce, lru_cache, cache, wraps, singledispatch, total_ordering." },
      { fr: "pathlib", obj: "Manipulation moderne des chemins",
        en: "How does pathlib work in Python for file path manipulation? Show Path operations, read_text, write_text, glob, joinpath, and comparisons with os.path." },
      { fr: "json", obj: "Lire et écrire du JSON",
        en: "How do I read and write JSON in Python with the json module? Show dumps, loads, dump, load, custom encoders/decoders." },
      { fr: "csv", obj: "Lire et écrire du CSV",
        en: "How do I read and write CSV files in Python with the csv module? Show reader, writer, DictReader, DictWriter, dialects." },
      { fr: "re (regex)", obj: "Expressions régulières",
        en: "How does the re module work in Python for regular expressions? Show match, search, findall, finditer, sub, groups, named groups, and common flags." },
      { fr: "datetime", obj: "Dates, heures, durées",
        en: "How does the datetime module work in Python? Show datetime, date, time, timedelta, strftime, strptime, and timezones with zoneinfo." },
      { fr: "argparse", obj: "Arguments de ligne de commande",
        en: "How do I parse command-line arguments with argparse in Python? Show positional arguments, optional arguments, flags, subcommands, and type conversion." },
      { fr: "logging", obj: "Tracer ce que fait ton programme",
        en: "How does the logging module work in Python? Show levels, basicConfig, handlers, formatters, named loggers, and best practices vs print." },
      { fr: "unittest", obj: "Tester ton code",
        en: "How do I write unit tests with the unittest module in Python? Show TestCase, assertions, setUp, tearDown, test discovery, and mocks." },
      { fr: "os et sys", obj: "Système d'exploitation et interpréteur",
        en: "What do os and sys provide in Python? Show common operations on environment, paths, processes, arguments, and the interpreter." },
    ],
  },
];

/** Total des concepts pour affichage du compteur dans la sidebar */
export const TOTAL_CONCEPTS = CURRICULUM.reduce(
  (sum, lvl) => sum + lvl.concepts.length,
  0,
);
