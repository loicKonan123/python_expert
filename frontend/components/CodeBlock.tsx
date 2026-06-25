"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import {
  checkCSharpAvailable,
  restartKernel,
  runCSharp,
  runPython,
  type RunResult,
} from "@/lib/api";
import { useTheme } from "@/lib/useTheme";
import { HtmlPreview, isPreviewable } from "./HtmlPreview";

// Monaco est lourd (~3 MB) — chargement dynamique côté client uniquement.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="px-4 py-3 text-on-surface-variant text-[13px] font-mono">
      Chargement de l&apos;éditeur...
    </div>
  ),
});

type Props = {
  code: string;
  lang?: string;
  filename?: string;
  /**
   * Blocs Python qui précèdent celui-ci dans la même réponse bot.
   * Fallback quand on n'a pas de session kernel — on les concatène pour
   * que les définitions soient disponibles. Si sessionId est fourni, ce
   * paramètre n'est utilisé que pour le PREMIER run (le kernel persiste
   * ensuite l'état pour les runs suivants).
   */
  precedingCode?: string[];
  /**
   * ID de session pour utiliser un kernel Python persistant. Typiquement
   * l'ID de la conversation courante. Les variables, classes et imports
   * survivent entre les Run successifs dans la même session.
   */
  sessionId?: string;
};

export function CodeBlock({
  code,
  lang = "python",
  filename,
  precedingCode,
  sessionId,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  /** Aperçu HTML/CSS/JS — toggle iframe sandboxée. */
  const [showPreview, setShowPreview] = useState(false);
  const theme = useTheme();
  const monacoTheme = theme === "light" ? "vs" : "vs-dark";

  const previewable = isPreviewable(lang);

  const langKey = normalizeLang(lang);
  const isRunnable = langKey === "python";
  const isCSharp = langKey === "csharp";
  const [csharpAvailable, setCsharpAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isCSharp) return;
    let cancelled = false;
    checkCSharpAvailable().then((ok) => {
      if (!cancelled) setCsharpAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [isCSharp]);

  // Calcule la hauteur en fonction du nombre de lignes (max 480px).
  const lineHeight = 22;
  const lines = code.split("\n").length;
  const height = Math.min(Math.max(lines * lineHeight + 24, 80), 480);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }

  // Stratégie d'envoi :
  //  - SANS sessionId : on concatène les blocs précédents (fallback one-shot)
  //  - AVEC sessionId : on envoie SEULEMENT le bloc courant. Le kernel
  //    persiste l'état des runs précédents, donc les définitions des blocs
  //    antérieurs sont déjà dispo si l'utilisateur les a exécutés. Si pas,
  //    le bloc échouera proprement avec un NameError — pédagogique.
  const cumulativeCount = precedingCode?.length ?? 0;
  const fullCode =
    !sessionId && cumulativeCount > 0
      ? precedingCode!.join("\n\n") + "\n\n" + code
      : code;

  async function execute() {
    if (running) return;
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const r = await runPython(fullCode, { sessionId });
      setResult(r);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function executeCSharp() {
    if (running) return;
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const r = await runCSharp(code);
      setResult(r);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function resetKernel() {
    if (!sessionId || running) return;
    if (!confirm("Redémarrer le kernel ? Toutes les variables définies seront perdues.")) {
      return;
    }
    try {
      await restartKernel(sessionId);
      setResult(null);
      setRunError(null);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    }
  }

  function clearResult() {
    setResult(null);
    setRunError(null);
  }

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="hero-code-preview rounded-xl overflow-hidden border border-outline-variant my-3">
      {/* Header — style fenêtre macOS */}
      <div className="px-4 py-2 bg-surface-container-highest flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider truncate">
            {filename ?? prettyLangLabel(lang)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isRunnable && (
            <>
              <button
                onClick={execute}
                disabled={running}
                className="flex items-center gap-1 text-[11px] font-mono text-secondary hover:brightness-125 disabled:opacity-50 disabled:cursor-wait transition-all"
                aria-label="Exécuter le code"
                title={
                  sessionId
                    ? "Exécute dans le kernel persistant (variables conservées entre les runs)"
                    : cumulativeCount > 0
                      ? `Exécute ce bloc + ${cumulativeCount} bloc(s) Python précédent(s)`
                      : "Exécute ce bloc en sandbox (timeout 10s)"
                }
              >
                <MaterialIcon
                  name={running ? "hourglass_empty" : "play_arrow"}
                  className={`text-[14px] ${running ? "animate-spin" : ""}`}
                />
                {running ? "Exécution..." : "Run"}
                {sessionId && !running && (
                  <span
                    className="ml-0.5 px-1 rounded bg-primary/20 text-[10px] text-primary"
                    title="Kernel persistant actif"
                  >
                    kernel
                  </span>
                )}
                {!sessionId && cumulativeCount > 0 && !running && (
                  <span className="ml-0.5 px-1 rounded bg-secondary/20 text-[10px]">
                    +{cumulativeCount}
                  </span>
                )}
              </button>
              {sessionId && (
                <button
                  onClick={resetKernel}
                  disabled={running}
                  className="flex items-center text-[11px] font-mono text-on-surface-variant hover:text-error disabled:opacity-40 transition-colors"
                  aria-label="Redémarrer le kernel"
                  title="Redémarrer le kernel (efface toutes les variables)"
                >
                  <MaterialIcon name="restart_alt" className="text-[14px]" />
                </button>
              )}
            </>
          )}
          {isCSharp && csharpAvailable && (
            <button
              onClick={executeCSharp}
              disabled={running}
              className="flex items-center gap-1 text-[11px] font-mono hover:brightness-125 disabled:opacity-50 disabled:cursor-wait transition-all"
              style={{ color: "#9B82E6" }}
              aria-label="Exécuter le code C#"
              title="Exécute ce bloc via dotnet-script (timeout 10s, sandbox jetable)"
            >
              <MaterialIcon
                name={running ? "hourglass_empty" : "play_arrow"}
                className={`text-[14px] ${running ? "animate-spin" : ""}`}
              />
              {running ? "Compilation..." : "Run C#"}
            </button>
          )}
          {previewable && (
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-mono text-accent hover:brightness-125 transition-colors"
              aria-label={showPreview ? "Masquer l'aperçu" : "Afficher l'aperçu"}
              title="Rendre le code dans une iframe sandboxée"
            >
              <MaterialIcon
                name={showPreview ? "visibility_off" : "visibility"}
                className="text-[14px]"
              />
              {showPreview ? "Masquer" : "Aperçu"}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-primary-fixed transition-colors"
            aria-label={copied ? "Code copié" : "Copier le code"}
          >
            <MaterialIcon
              name={copied ? "check" : "content_copy"}
              className="text-[14px]"
            />
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      </div>

      {/* Monaco read-only */}
      <MonacoEditor
        value={code}
        language={langKey}
        theme={monacoTheme}
        height={height}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily:
            "var(--font-jetbrains-mono), 'JetBrains Mono', Consolas, monospace",
          lineHeight: 22,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "none",
          lineNumbers: "off",
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          glyphMargin: false,
          folding: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          guides: { indentation: false },
          contextmenu: false,
          wordWrap: "on",
        }}
        onMount={(editor) => {
          editor.updateOptions({ readOnly: true });
        }}
      />

      {/* Output du sandbox */}
      {(result || runError) && (
        <SandboxOutput
          result={result}
          error={runError}
          onClear={clearResult}
        />
      )}

      {/* Aperçu HTML/CSS/JS — iframe sandboxée avec Tailwind CDN */}
      {previewable && showPreview && (
        <HtmlPreview code={code} lang={lang.toLowerCase() as "html" | "css" | "javascript" | "js"} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant interne : affichage du résultat de l'exécution sandbox
// ---------------------------------------------------------------------------

function SandboxOutput({
  result,
  error,
  onClear,
}: {
  result: RunResult | null;
  error: string | null;
  onClear: () => void;
}) {
  if (error) {
    return (
      <div className="border-t border-outline-variant px-4 py-3 bg-error/5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-error">
            ⚠ Erreur sandbox
          </span>
          <ClearButton onClick={onClear} />
        </div>
        <pre className="text-[12px] text-error font-mono whitespace-pre-wrap break-words">
          {error}
        </pre>
      </div>
    );
  }

  if (!result) return null;

  const ok = result.exit_code === 0 && !result.timeout;
  const statusColor = ok
    ? "text-green-400"
    : result.timeout
      ? "text-yellow-400"
      : "text-error";

  const statusIcon = ok ? "check_circle" : result.timeout ? "schedule" : "error";
  const statusLabel = result.timeout
    ? `⏱ Timeout après ${(result.elapsed_ms / 1000).toFixed(1)}s`
    : ok
      ? `Exécuté en ${result.elapsed_ms}ms`
      : `Exit code ${result.exit_code} (${result.elapsed_ms}ms)`;

  return (
    <div className="border-t border-on-surface/10 hero-code-preview">
      {/* Bandeau résultat avec dot status pulsant */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className={`flex items-center gap-2 text-[11px] font-mono ${statusColor}`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-400 animate-pulse" : result.timeout ? "bg-yellow-400" : "bg-error"}`}
          />
          <MaterialIcon name={statusIcon} className="text-[14px]" />
          <span>{statusLabel}</span>
          {result.truncated && (
            <span className="text-on-surface-variant italic ml-2">
              (sortie tronquée)
            </span>
          )}
        </div>
        <ClearButton onClick={onClear} />
      </div>

      {/* stdout */}
      {result.stdout && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-1 rounded-full bg-accent" />
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent/80">
              stdout
            </div>
          </div>
          <pre className="text-[12px] text-on-surface font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto custom-scrollbar">
            {result.stdout}
          </pre>
        </div>
      )}

      {/* stderr */}
      {result.stderr && (
        <div
          className={`px-4 py-3 ${result.stdout ? "border-t border-white/5" : ""}`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-1 rounded-full bg-error" />
            <div className="text-[10px] font-mono uppercase tracking-widest text-error/80">
              stderr
            </div>
          </div>
          <pre className="text-[12px] text-error/90 font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto custom-scrollbar">
            {result.stderr}
          </pre>
        </div>
      )}

      {/* Pas de sortie */}
      {!result.stdout && !result.stderr && (
        <div className="px-4 py-3 text-[12px] text-on-surface-variant italic">
          (aucune sortie)
        </div>
      )}
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-on-surface-variant hover:text-on-surface text-[12px] flex items-center gap-1"
      title="Fermer le résultat"
    >
      <MaterialIcon name="close" className="text-[14px]" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers langage
// ---------------------------------------------------------------------------

function normalizeLang(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "py") return "python";
  if (l === "js" || l === "jsx") return "javascript";
  if (l === "ts" || l === "tsx") return "typescript";
  if (l === "sh" || l === "bash" || l === "zsh") return "shell";
  if (l === "cs" || l === "c#" || l === "csharp") return "csharp";
  return l;
}

function prettyLangLabel(lang: string): string {
  const l = lang.toLowerCase();
  return (
    {
      python: "Python",
      py: "Python",
      javascript: "JavaScript",
      js: "JavaScript",
      typescript: "TypeScript",
      ts: "TypeScript",
      shell: "Shell",
      sh: "Shell",
      bash: "Bash",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      yaml: "YAML",
      sql: "SQL",
      csharp: "C#",
      cs: "C#",
      "c#": "C#",
    }[l] ?? "Code"
  );
}
