"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { runPython, type RunResult } from "@/lib/api";

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
};

export function CodeBlock({ code, lang = "python", filename }: Props) {
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const langKey = normalizeLang(lang);
  const isRunnable = langKey === "python";

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

  async function execute() {
    if (running) return;
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const r = await runPython(code);
      setResult(r);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
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
    <div className="rounded-xl overflow-hidden border border-outline-variant bg-[#010409] my-3">
      {/* Header */}
      <div className="px-4 py-2 bg-surface-container-highest flex justify-between items-center border-b border-outline-variant">
        <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
          {filename ?? prettyLangLabel(lang)}
        </span>
        <div className="flex items-center gap-3">
          {isRunnable && (
            <button
              onClick={execute}
              disabled={running}
              className="flex items-center gap-1 text-[11px] font-mono text-secondary hover:brightness-125 disabled:opacity-50 disabled:cursor-wait transition-all"
              aria-label="Exécuter le code"
              title="Exécuter en sandbox (timeout 10s)"
            >
              <MaterialIcon
                name={running ? "hourglass_empty" : "play_arrow"}
                className={`text-[14px] ${running ? "animate-spin" : ""}`}
              />
              {running ? "Exécution..." : "Run"}
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
        theme="vs-dark"
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
    <div className="border-t border-outline-variant bg-surface-container-low">
      {/* Bandeau résultat */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-outline-variant/40">
        <div className={`flex items-center gap-2 text-[11px] font-mono ${statusColor}`}>
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
          <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-1.5">
            stdout
          </div>
          <pre className="text-[12px] text-on-surface font-mono whitespace-pre-wrap break-words max-h-72 overflow-y-auto custom-scrollbar">
            {result.stdout}
          </pre>
        </div>
      )}

      {/* stderr */}
      {result.stderr && (
        <div
          className={`px-4 py-3 ${result.stdout ? "border-t border-outline-variant/40" : ""}`}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-error/80 mb-1.5">
            stderr
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
    }[l] ?? "Code"
  );
}
