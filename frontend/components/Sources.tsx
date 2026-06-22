"use client";

import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { metaForCorpus } from "@/lib/corpus-meta";
import type { Source } from "@/lib/api";

type Props = { sources: Source[] };

/** Imperatively expose a method to open a specific source from outside. */
export type SourcesHandle = {
  openSource: (idx: number) => void;
};

export const Sources = forwardRef<SourcesHandle, Props>(function Sources(
  { sources },
  ref,
) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    openSource: (idx: number) => {
      if (idx < 0 || idx >= sources.length) return;
      setOpenIdx(idx);
      requestAnimationFrame(() => {
        chipRefs.current[idx]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        chipRefs.current[idx]?.focus();
      });
    },
  }));

  if (!sources.length) return null;

  // Score le plus haut → indicateur global de qualité du retrieval
  const topScore = Math.max(...sources.map((s) => s.score));
  const quality = qualityForScore(topScore);

  return (
    <div ref={containerRef} className="pt-4 mt-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MaterialIcon name="menu_book" className="text-[16px] text-accent" />
          <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">
            Sources documentaires
          </span>
          <span className="font-mono text-[11px] text-on-surface-variant/40">
            · {sources.length}
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] font-mono ${quality.textClass}`}
          title={`Score max ${topScore.toFixed(3)} — ${quality.tooltip}`}
        >
          <span className={`w-2 h-2 rounded-full ${quality.dotClass}`} />
          {quality.label}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {sources.map((s, i) => {
          const meta = metaForCorpus(s.corpus);
          const isActive = openIdx === i;
          return (
            <button
              key={i}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              onClick={() => setOpenIdx(isActive ? null : i)}
              className={`px-3 py-1.5 rounded-full border text-[12px] flex items-center gap-1.5 transition-all ${
                isActive
                  ? "bg-action text-white border-transparent shadow-[0_4px_16px_-4px_rgba(99,102,241,0.6)]"
                  : `${meta.bgColor} ${meta.color} hover:brightness-125 hover:-translate-y-0.5`
              }`}
              title={`[${i + 1}] ${s.corpus}/${s.source} — score ${s.score.toFixed(3)}`}
            >
              <span className="text-[10px] font-mono opacity-70">[{i + 1}]</span>
              <MaterialIcon name={meta.icon} className="text-[12px]" />
              <span className="font-mono truncate max-w-65">{s.source}</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">
                {s.score.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

      {openIdx !== null && sources[openIdx] && (
        <div className="mt-3 p-4 glass-card rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
            <MaterialIcon name="article" className="text-[14px]" />
            <span className={metaForCorpus(sources[openIdx].corpus).color}>
              {metaForCorpus(sources[openIdx].corpus).label}
            </span>
            <span className="opacity-50">/</span>
            <span>{sources[openIdx].source}</span>
            {sources[openIdx].section && (
              <>
                <span className="opacity-50">·</span>
                <span className="normal-case tracking-normal text-on-surface-variant">
                  {sources[openIdx].section}
                </span>
              </>
            )}
          </div>
          <pre className="text-[12px] text-on-surface-variant whitespace-pre-wrap font-mono max-h-[280px] overflow-y-auto custom-scrollbar">
            {sources[openIdx].text}
          </pre>
        </div>
      )}
    </div>
  );
});

function qualityForScore(score: number): {
  label: string;
  tooltip: string;
  textClass: string;
  dotClass: string;
} {
  if (score >= 0.7) {
    return {
      label: "Excellent",
      tooltip: "Sources très pertinentes — réponse fiable",
      textClass: "text-green-400",
      dotClass: "bg-green-400 animate-pulse",
    };
  }
  if (score >= 0.55) {
    return {
      label: "Bon",
      tooltip: "Sources pertinentes — réponse globalement fiable",
      textClass: "text-emerald-400",
      dotClass: "bg-emerald-400",
    };
  }
  if (score >= 0.45) {
    return {
      label: "Moyen",
      tooltip: "Pertinence modérée — vérifier les sources",
      textClass: "text-yellow-400",
      dotClass: "bg-yellow-400",
    };
  }
  return {
    label: "Faible",
    tooltip: "Sources peu pertinentes — la réponse peut s'éloigner de la doc",
    textClass: "text-error",
    dotClass: "bg-error",
  };
}
