"use client";

import { MaterialIcon } from "./MaterialIcon";
import { metaForCorpus } from "@/lib/corpus-meta";
import type { Corpus } from "@/lib/curriculum";


const ALL_CORPORA: Corpus[] = [
  "python",
  "fastapi",
  "pydantic",
  "nextjs",
  "typescript",
  "tailwind",
  "self",
  // Phase 7 — écosystème
  "pytest",
  "httpx",
  "sqlalchemy",
  "zod",
  "tanstack_query",
  "vitest",
  // Phase 12 — front-end MDN
  "html",
  "css",
  "javascript",
  // Phase 13 — écosystème .NET
  "csharp",
  "aspnet",
  "efcore",
  // Phase 16 — Architecture + DevOps
  "twelve_factor",
  "docker",
  "github_actions",
];

type Props = {
  selected: Corpus[];
  onChange: (next: Corpus[]) => void;
};

/**
 * Barre de chips pour limiter la recherche à certains corpus.
 * Sélection vide = recherche dans tous (équivalent à "Tous" actif).
 */
export function CorpusFilter({ selected, onChange }: Props) {
  const isAll = selected.length === 0 || selected.length === ALL_CORPORA.length;

  function toggle(corpus: Corpus) {
    if (selected.includes(corpus)) {
      onChange(selected.filter((c) => c !== corpus));
    } else {
      onChange([...selected, corpus]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mr-1">
        Sources
      </span>
      <button
        onClick={() => onChange([])}
        className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
          isAll
            ? "bg-gradient-to-br from-accent to-accent/70 text-[#0b1326] font-semibold shadow-[0_4px_16px_-4px_rgba(251,191,36,0.5)]"
            : "bg-surface-container-low/40 text-on-surface-variant border border-outline-variant/40 hover:text-accent hover:border-accent/40"
        }`}
      >
        Tous
      </button>
      {ALL_CORPORA.map((corpus) => {
        const meta = metaForCorpus(corpus);
        const active = !isAll && selected.includes(corpus);
        return (
          <button
            key={corpus}
            onClick={() => toggle(corpus)}
            className={`px-3 py-1 rounded-full text-[11px] inline-flex items-center gap-1 transition-all ${
              active
                ? `${meta.bgColor} ${meta.color} border border-current/30 shadow-[0_4px_16px_-6px_currentColor]`
                : "bg-surface-container-low/40 text-on-surface-variant border border-outline-variant/40 hover:text-on-surface hover:border-outline-variant"
            }`}
            title={`${active ? "Retirer" : "Limiter à"} ${meta.label}`}
          >
            <MaterialIcon name={meta.icon} className="text-[12px]" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
