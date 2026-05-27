"use client";

import { useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import type { Source } from "@/lib/api";

type Props = { sources: Source[] };

export function Sources({ sources }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!sources.length) return null;

  return (
    <div className="pt-4 mt-4 border-t border-outline-variant">
      <div className="flex items-center gap-2 mb-2">
        <MaterialIcon
          name="menu_book"
          className="text-[16px] text-secondary"
        />
        <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">
          Sources documentaires
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {sources.map((s, i) => (
          <button
            key={i}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className={`px-3 py-1 rounded-full border text-[12px] flex items-center gap-1.5 transition-all ${
              openIdx === i
                ? "bg-primary-container text-on-primary-container border-primary"
                : "bg-surface-container-highest text-primary border-outline-variant hover:bg-primary-container hover:text-on-primary-container"
            }`}
            title={`Score : ${s.score.toFixed(3)}`}
          >
            <MaterialIcon name="link" className="text-[12px]" />
            <span className="font-mono truncate max-w-[260px]">
              {s.source}
            </span>
            <span className="text-[10px] opacity-70 font-mono">
              {s.score.toFixed(2)}
            </span>
          </button>
        ))}
      </div>

      {openIdx !== null && sources[openIdx] && (
        <div className="mt-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
            <MaterialIcon name="article" className="text-[14px]" />
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
}
