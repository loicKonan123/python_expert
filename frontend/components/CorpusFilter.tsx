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
      <button
        onClick={() => onChange([])}
        className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all ${
          isAll
            ? "bg-primary-container text-on-primary-container border-primary"
            : "bg-transparent text-on-surface-variant border-outline-variant hover:text-on-surface"
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
            className={`px-2.5 py-1 rounded-md border text-[11px] inline-flex items-center gap-1 transition-all ${
              active
                ? `${meta.bgColor} ${meta.color}`
                : "bg-transparent text-on-surface-variant border-outline-variant hover:text-on-surface"
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
