"""Exécution sécurisée de code C# pour le tuteur (Phase 15).

Stratégie : on délègue l'exécution à ``dotnet-script`` (Roslyn scripting,
fichier .csx). Pas d'équivalent direct de PEP 578 en .NET, donc on s'appuie
sur les protections subprocess standard :

  1. Sous-processus isolé (mort si parent meurt).
  2. CWD = dossier temporaire jetable.
  3. Env nettoyé : on ne passe que PATH, SYSTEMROOT, TEMP/TMP, plus les
     vars DOTNET_* indispensables. Pas de .env, pas de credentials.
  4. Timeout strict (10s par défaut), kill au dépassement.
  5. Output tronqué.
  6. Pas de stdin (DEVNULL).

Ce qui N'EST PAS protégé :
  - Accès filesystem hors sandbox (le sous-processus a les droits user).
  - Accès réseau (sockets autorisés).
  - Reflection / P/Invoke.
Pour usage local solo c'est suffisant. Pour public : container.
"""
from __future__ import annotations

import logging
import os
import re
import subprocess
import tempfile
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


logger = logging.getLogger(__name__)


_ALLOWED_ENV_KEYS = frozenset({
    "PATH",
    "PATHEXT",           # Windows : nécessaire pour résoudre dotnet.exe
    "SYSTEMROOT",
    "TEMP", "TMP",
    "USERPROFILE",       # dotnet-script lit ~/.dotnet pour ses paquets cache
    "APPDATA", "LOCALAPPDATA",  # Windows : NuGet cache, dotnet config
    "HOMEDRIVE", "HOMEPATH",
    "DOTNET_ROOT",
    "DOTNET_CLI_HOME",
    "DOTNET_NOLOGO",
    "DOTNET_CLI_TELEMETRY_OPTOUT",
    "ProgramFiles", "ProgramFiles(x86)",
    "WINDIR",
})


@dataclass
class CSharpSandboxResult:
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: int
    timeout: bool
    truncated: bool


@lru_cache(maxsize=1)
def is_dotnet_script_available() -> bool:
    """Vérifie au boot si ``dotnet script`` est installé et lance un .csx."""
    try:
        proc = subprocess.run(
            ["dotnet", "script", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        ok = proc.returncode == 0
        if ok:
            logger.info("[CSHARP] dotnet-script détecté : %s",
                        proc.stdout.strip() or proc.stderr.strip())
        else:
            logger.warning("[CSHARP] dotnet script --version exit=%d", proc.returncode)
        return ok
    except FileNotFoundError:
        logger.warning("[CSHARP] dotnet introuvable dans PATH")
        return False
    except subprocess.TimeoutExpired:
        logger.warning("[CSHARP] dotnet script --version timeout")
        return False
    except Exception as exc:
        logger.warning("[CSHARP] check dotnet-script échoué : %s", exc)
        return False


def _build_safe_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for key in _ALLOWED_ENV_KEYS:
        if key in os.environ:
            env[key] = os.environ[key]
    env["DOTNET_NOLOGO"] = "1"
    env["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1"
    return env


def _truncate(text: str, max_bytes: int) -> tuple[str, bool]:
    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= max_bytes:
        return text, False
    truncated = encoded[:max_bytes].decode("utf-8", errors="replace")
    return truncated + "\n\n[... output tronqué ...]", True


def _clean_traceback(text: str, script_path: Path) -> str:
    """Remplace le chemin du fichier temp par un label lisible."""
    if not text:
        return text
    return text.replace(str(script_path), "<snippet>")


# Warnings noise pour un contexte tuteur. On les filtre en sortie pour ne
# garder que les erreurs réelles et les warnings pédagogiquement utiles.
#
# CS7022  : top-level statements + Main() → Main ignoré
# CS0219  : variable assignée jamais lue
# CS0649  : champ jamais assigné (default value)
# CS0168  : variable déclarée jamais utilisée
# CS8321  : fonction locale jamais utilisée
# CS0414  : champ assigné mais jamais lu
_NOISE_WARNINGS = re.compile(
    r"^.*warning CS(7022|0219|0649|0168|8321|0414)\b.*\r?\n?",
    re.MULTILINE,
)


def _filter_noise(text: str) -> str:
    """Strip les warnings cosmétiques. Garde tout le reste (errors, autres warnings)."""
    if not text:
        return text
    return _NOISE_WARNINGS.sub("", text)


# Détection des scénarios qui nécessitent un SDK / paquet NuGet en .csx.
# Si le code matche → on prepend une directive `#r` en tête de script.
_ASPNET_HINTS = re.compile(
    r"\b(WebApplication|MapGet|MapPost|MapPut|MapDelete|MapPatch|"
    r"\[ApiController\]|HttpContext|IActionResult|ControllerBase|"
    r"WebApplicationBuilder|builder\.Services\.Add|app\.Use)\b"
)
_EFCORE_HINTS = re.compile(
    r"\b(DbContext|DbSet<|UseSqlite|UseSqlServer|UseInMemoryDatabase|OnModelCreating)\b"
)


def _detect_refs(code: str) -> list[str]:
    """Retourne les directives `#r` à injecter selon le contenu du code.

    Note : ASP.NET Core n'est PAS supporté par dotnet-script (nécessite un
    projet web complet). On le détecte ailleurs pour renvoyer un message
    clair à l'utilisateur plutôt que de tenter une exécution qui échouera.
    """
    refs: list[str] = []
    if _EFCORE_HINTS.search(code):
        refs.append('#r "nuget: Microsoft.EntityFrameworkCore.Sqlite, 9.0.0"')
        refs.append('#r "nuget: Microsoft.EntityFrameworkCore.InMemory, 9.0.0"')
    return refs


def _aspnet_message() -> str:
    """Message clair pour les snippets ASP.NET Core non exécutables en .csx."""
    return (
        "Ce snippet utilise ASP.NET Core, qui nécessite un projet web complet "
        "et ne peut pas s'exécuter dans dotnet-script (.csx).\n\n"
        "Pour le tester localement :\n"
        "  dotnet new web -o demo\n"
        "  cd demo\n"
        "  # remplace Program.cs par le code ci-dessus\n"
        "  dotnet run"
    )


# Détecte une classe `class Program { ... static void Main(...) ... }`
# accompagnée de top-level statements. On strippe la classe entière car
# le top-level prend le pas en .csx, et le wrapper génère CS7022.
# Pattern : matche `class Program` + le bloc équilibré jusqu'au `}` final.
# Comme regex ne gère pas les accolades équilibrées arbitrairement, on
# matche une class Program qui contient AU MOINS un static Main(...).
_PROGRAM_CLASS = re.compile(
    r"""
    (?:public\s+|internal\s+)?
    (?:static\s+|partial\s+)?
    class\s+Program\b
    \s*\{
    [^{}]*
    (?:\{[^{}]*\}[^{}]*)*?
    \bstatic\s+(?:void|int|async\s+Task(?:<int>)?)\s+Main\s*\([^)]*\)
    [^{}]*
    \{(?:[^{}]|\{[^{}]*\})*\}
    [^{}]*
    \}
    """,
    re.VERBOSE | re.DOTALL,
)

# Fallback : si pas de wrapper class, juste une méthode Main au top-level.
_MAIN_METHOD = re.compile(
    r"""
    (?:public\s+|internal\s+|private\s+|protected\s+)?
    \bstatic\s+(?:void|int|async\s+Task(?:<int>)?)\s+Main\s*\([^)]*\)\s*
    \{(?:[^{}]|\{[^{}]*\})*\}
    """,
    re.VERBOSE | re.DOTALL,
)


# Extrait le corps d'une méthode Main(...) pour le promouvoir au top-level.
# Capture aussi la signature complète pour détecter si elle prend `args`.
_MAIN_BODY = re.compile(
    r"""
    \bstatic\s+(?:void|int|async\s+Task(?:<int>)?)\s+Main\s*
    \((?P<sig>[^)]*)\)\s*
    \{(?P<body>(?:[^{}]|\{[^{}]*\})*)\}
    """,
    re.VERBOSE | re.DOTALL,
)


def _extract_using_directives(code: str) -> tuple[list[str], str]:
    """Sépare les directives `using` (au niveau fichier) du reste."""
    usings: list[str] = []
    others: list[str] = []
    for line in code.split("\n"):
        stripped = line.strip()
        if stripped.startswith("using ") and stripped.endswith(";") and "=" not in stripped:
            usings.append(stripped)
        else:
            others.append(line)
    return usings, "\n".join(others)


def _promote_main_to_top_level(code: str) -> tuple[str, bool]:
    """Transforme un programme C# classique en script top-level.

    On remplace la classe `Program` (qui contient Main) par le body de Main.
    Les autres classes sœurs (Livre, Bibliotheque, etc.) sont préservées
    telles quelles autour de la promotion.

    Cas typique :
        using System;
        class Livre { ... }
        class Program {
            static void Main() {
                var l = new Livre();
            }
        }
    devient :
        using System;
        class Livre { ... }
        var l = new Livre();

    Retourne (code_modifié, was_promoted).
    """
    prog_match = _PROGRAM_CLASS.search(code)
    if not prog_match:
        return code, False

    # Extrait le body de Main DANS la classe Program (pas ailleurs).
    program_block = prog_match.group(0)
    main_match = _MAIN_BODY.search(program_block)
    if not main_match:
        return code, False

    body = main_match.group("body").strip()
    sig = main_match.group("sig")
    # Si Main prend `string[] args`, on injecte `args` au top-level depuis
    # GetCommandLineArgs (dotnet-script ne fournit pas `args` automatiquement
    # comme le ferait un vrai programme .NET).
    if re.search(r"\bstring\s*\[\s*\]\s*args\b", sig):
        # Pas de Linq pour éviter une dépendance implicite sur using System.Linq.
        body = "string[] args = new string[0];\n" + body

    # Remplace UNIQUEMENT la classe Program par le body de Main.
    # Le reste du fichier (autres classes, usings, etc.) reste intact.
    rebuilt = code[:prog_match.start()] + body + "\n" + code[prog_match.end():]
    return rebuilt, True


def _has_top_level(code: str) -> bool:
    """Heuristique : ya-t-il du code top-level (hors method/class) ?

    On regarde si une ligne au niveau d'indentation racine commence par
    un appel ou une déclaration qui n'est PAS `using`, `namespace`,
    `class`, `record`, `struct`, `interface`, `enum`, `[`, `//`, `#`.
    """
    for raw in code.split("\n"):
        line = raw.lstrip()
        # On ne s'intéresse qu'aux lignes au niveau racine (pas indentées).
        if raw != line:
            continue
        if not line or line.startswith(("//", "/*", "*", "#", "[")):
            continue
        # Accolades isolées : délimiteurs de bloc, pas du top-level.
        if line in ("{", "}", "};"):
            continue
        if line.startswith((
            "using ", "namespace ", "class ", "record ", "struct ",
            "interface ", "enum ", "public ", "internal ", "private ",
            "protected ", "static ", "abstract ", "sealed ", "partial ",
            "async ", "}",
        )):
            continue
        # Tout le reste (Console.WriteLine, var x = ..., await ..., return ...)
        # ressemble à du top-level.
        return True
    return False


def _strip_main_wrapper(code: str) -> tuple[str, bool]:
    """Si le code mélange top-level + Main(), strip le wrapper pour éviter CS7022.

    On essaie dans l'ordre :
      1. Strip de toute la classe Program qui contient Main → propre.
      2. Sinon strip de la méthode Main seule (fallback).

    Retourne (code_modifié, was_stripped).
    """
    if not _has_top_level(code):
        return code, False

    if _PROGRAM_CLASS.search(code):
        return _PROGRAM_CLASS.sub("", code, count=1), True

    if _MAIN_METHOD.search(code):
        return _MAIN_METHOD.sub("", code, count=1), True

    return code, False


def _preprocess_code(code: str) -> str:
    """Pipeline d'améliorations Phase 15.B :
       1. Si programme C# classique (class Program + Main, sans top-level) →
          promouvoir le corps de Main en top-level pour que .csx l'exécute.
       2. Sinon si top-level + Main coexistent → strip le wrapper (CS7022).
       3. Auto-injection des directives `#r` pour EF Core.
    """
    if not _has_top_level(code) and _MAIN_BODY.search(code):
        promoted, ok = _promote_main_to_top_level(code)
        if ok:
            logger.info("[CSHARP] promote Main() body → top-level statements")
            code = promoted
    else:
        code, stripped = _strip_main_wrapper(code)
        if stripped:
            logger.info("[CSHARP] strip Main() wrapper (collision top-level)")

    refs = _detect_refs(code)
    if refs:
        logger.info("[CSHARP] auto-inject %d directive(s) #r : %s",
                    len(refs), ", ".join(refs))
        code = "\n".join(refs) + "\n\n" + code
    return code


def run_csharp(
    code: str,
    timeout_s: float = 10.0,
    max_output_bytes: int = 8 * 1024,
) -> CSharpSandboxResult:
    """Exécute du code C# via dotnet-script.

    Args:
        code: source C# (script .csx — top-level statements OK).
        timeout_s: limite de temps avant kill.
        max_output_bytes: taille max stdout / stderr.
    """
    if not code or not code.strip():
        return CSharpSandboxResult(
            stdout="",
            stderr="(code vide)",
            exit_code=1,
            elapsed_ms=0,
            timeout=False,
            truncated=False,
        )

    if not is_dotnet_script_available():
        return CSharpSandboxResult(
            stdout="",
            stderr="[Sandbox C# : dotnet-script non installé sur ce backend]",
            exit_code=-3,
            elapsed_ms=0,
            timeout=False,
            truncated=False,
        )

    env = _build_safe_env()
    start = time.perf_counter()

    # Phase 15.B : court-circuit si ASP.NET (non runnable en .csx).
    if _ASPNET_HINTS.search(code):
        logger.info("[CSHARP] code ASP.NET détecté → message au lieu d'exécuter")
        return CSharpSandboxResult(
            stdout="",
            stderr=_aspnet_message(),
            exit_code=2,
            elapsed_ms=0,
            timeout=False,
            truncated=False,
        )

    # Phase 15.B : strip Main si top-level, auto-inject #r pour EF Core.
    processed = _preprocess_code(code)

    with tempfile.TemporaryDirectory(prefix="csexpert_sandbox_") as tmpdir:
        script_path = Path(tmpdir) / "snippet.csx"
        script_path.write_text(processed, encoding="utf-8")

        logger.info("[SANDBOX-CS] exécution code %d chars, timeout %.0fs",
                    len(code), timeout_s)

        try:
            proc = subprocess.run(
                ["dotnet", "script", str(script_path)],
                cwd=tmpdir,
                env=env,
                capture_output=True,
                text=False,
                timeout=timeout_s,
                check=False,
                stdin=subprocess.DEVNULL,
            )
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            stdout_raw = proc.stdout.decode("utf-8", errors="replace")
            stderr_raw = proc.stderr.decode("utf-8", errors="replace")
            stderr_raw = _clean_traceback(stderr_raw, script_path)
            stderr_raw = _filter_noise(stderr_raw)

            stdout, t1 = _truncate(stdout_raw, max_output_bytes)
            stderr, t2 = _truncate(stderr_raw, max_output_bytes)

            result = CSharpSandboxResult(
                stdout=stdout,
                stderr=stderr,
                exit_code=proc.returncode,
                elapsed_ms=elapsed_ms,
                timeout=False,
                truncated=t1 or t2,
            )
            logger.info(
                "[SANDBOX-CS] terminé exit=%d en %dms (stdout=%dB, stderr=%dB)",
                result.exit_code, result.elapsed_ms,
                len(stdout_raw), len(stderr_raw),
            )
            return result

        except subprocess.TimeoutExpired as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            stdout = exc.stdout.decode("utf-8", errors="replace") if exc.stdout else ""
            stderr = exc.stderr.decode("utf-8", errors="replace") if exc.stderr else ""
            stderr = _clean_traceback(stderr, script_path)
            stdout, t1 = _truncate(stdout, max_output_bytes)
            stderr, t2 = _truncate(stderr, max_output_bytes)
            logger.warning("[SANDBOX-CS] TIMEOUT après %.1fs", timeout_s)
            return CSharpSandboxResult(
                stdout=stdout,
                stderr=(stderr + f"\n\n[Sandbox C# : timeout après {timeout_s:.0f}s]")
                       .strip(),
                exit_code=-1,
                elapsed_ms=elapsed_ms,
                timeout=True,
                truncated=t1 or t2,
            )
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.exception("[SANDBOX-CS] erreur inattendue : %s", exc)
            return CSharpSandboxResult(
                stdout="",
                stderr=f"[Erreur sandbox C# : {exc}]",
                exit_code=-2,
                elapsed_ms=elapsed_ms,
                timeout=False,
                truncated=False,
            )
