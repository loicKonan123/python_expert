"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

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

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="rounded-xl overflow-hidden border border-outline-variant bg-[#010409] my-3">
      {/* Header */}
      <div className="px-4 py-2 bg-surface-container-highest flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary opacity-60" />
          <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
            {filename ?? `snippet.${extOf(lang)}`}
          </span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-primary-fixed transition-colors"
        >
          <MaterialIcon
            name={copied ? "check" : "content_copy"}
            className="text-[14px]"
          />
          {copied ? "Copié" : "Copier"}
        </button>
      </div>

      {/* Monaco read-only */}
      <MonacoEditor
        value={code}
        language={normalizeLang(lang)}
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
          // Désactive le focus auto pour ne pas scroller la page.
          editor.updateOptions({ readOnly: true });
        }}
      />
    </div>
  );
}

function normalizeLang(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "py") return "python";
  if (l === "js" || l === "jsx") return "javascript";
  if (l === "ts" || l === "tsx") return "typescript";
  if (l === "sh" || l === "bash" || l === "zsh") return "shell";
  return l;
}

function extOf(lang: string): string {
  const l = lang.toLowerCase();
  return (
    {
      python: "py",
      javascript: "js",
      typescript: "ts",
      shell: "sh",
      bash: "sh",
    }[l] ?? "txt"
  );
}
