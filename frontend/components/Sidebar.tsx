"use client";

import { useMemo, useState } from "react";
import { CURRICULUM, TOTAL_CONCEPTS, type Concept, type Corpus, type Level } from "@/lib/curriculum";
import { MaterialIcon } from "./MaterialIcon";


/** Couleurs et icônes par techno — sert aux séparateurs et accents. */
const CORPUS_META: Record<Corpus, { label: string; color: string; icon: string }> = {
  python:         { label: "Python",         color: "text-[#FFD43B]", icon: "terminal" },
  fastapi:        { label: "FastAPI",        color: "text-[#009688]", icon: "bolt" },
  pydantic:       { label: "Pydantic",       color: "text-[#E92063]", icon: "schema" },
  nextjs:         { label: "Next.js",        color: "text-on-surface", icon: "web" },
  typescript:     { label: "TypeScript",     color: "text-[#3178C6]", icon: "code" },
  tailwind:       { label: "Tailwind CSS",   color: "text-[#06B6D4]", icon: "format_paint" },
  self:           { label: "Self (mon code)",color: "text-primary-fixed-dim", icon: "folder_special" },
  pytest:         { label: "pytest",         color: "text-[#0A9EDC]", icon: "bug_report" },
  httpx:          { label: "httpx",          color: "text-[#6BC04B]", icon: "http" },
  sqlalchemy:     { label: "SQLAlchemy",     color: "text-[#D71F00]", icon: "database" },
  zod:            { label: "Zod",            color: "text-[#3B82C4]", icon: "verified" },
  tanstack_query: { label: "TanStack Query", color: "text-[#FF4154]", icon: "sync" },
  vitest:         { label: "Vitest",         color: "text-[#FCC72B]", icon: "science" },
  html:           { label: "HTML",           color: "text-[#E34F26]", icon: "html" },
  css:            { label: "CSS",            color: "text-[#1572B6]", icon: "css" },
  javascript:     { label: "JavaScript",     color: "text-[#F7DF1E]", icon: "javascript" },
  csharp:         { label: "C#",             color: "text-[#9B82E6]", icon: "code_blocks" },
  aspnet:         { label: "ASP.NET Core",   color: "text-[#A88FE6]", icon: "dns" },
  efcore:         { label: "EF Core",        color: "text-[#6FA9E6]", icon: "storage" },
};

type Props = {
  open: boolean;
  activeLevelNum: string | null;
  onPickConcept: (concept: Concept, level: Level) => void;
  /** Permet à la sidebar de se fermer (utilisé en mobile après pick / clic backdrop). */
  onClose?: () => void;
};

export function Sidebar({ open, activeLevelNum, onPickConcept, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([CURRICULUM[0].num]),
  );

  const filtered = useMemo(() => filterCurriculum(filter), [filter]);

  function toggle(num: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  }

  // Sur mobile, sélectionner un concept ferme la sidebar pour libérer l'écran.
  function pickAndMaybeClose(concept: Concept, level: Level) {
    onPickConcept(concept, level);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  }

  return (
    <>
      {/* Backdrop mobile — ferme la sidebar au clic */}
      {open && onClose && (
        <button
          aria-label="Fermer le menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-sidebar-width z-40 bg-surface-container-low/70 shell-deep backdrop-blur-xl backdrop-saturate-150 border-r border-on-surface/10 flex flex-col py-gutter transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
      {/* En-tête de la sidebar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <MaterialIcon name="terminal" filled className="text-on-primary-container" />
          </div>
          <div>
            <h2 className="text-[20px] leading-tight font-semibold text-primary">
              Curriculum
            </h2>
            <p className="text-[14px] text-on-surface-variant leading-tight">
              {TOTAL_CONCEPTS} concepts · {new Set(CURRICULUM.map((l) => l.corpus)).size} technos
            </p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="px-4 mb-3">
        <div className="relative">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]"
          />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer un concept..."
            className="w-full bg-surface-container-highest text-on-surface text-[14px] pl-9 pr-3 py-2 rounded-lg border border-transparent focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {filtered.map((level, i) => {
          const isExpanded = expanded.has(level.num) || filter.length > 0;
          const isActive = activeLevelNum === level.num;
          const isFirstOfCorpus = i === 0 || filtered[i - 1].corpus !== level.corpus;
          const meta = CORPUS_META[level.corpus];

          return (
            <div key={level.num} className="space-y-1">
              {isFirstOfCorpus && (
                <div className="flex items-center gap-2 px-2 pt-4 pb-1 select-none">
                  <MaterialIcon name={meta.icon} className={`text-[14px] ${meta.color}`} filled />
                  <span className={`text-[11px] font-mono uppercase tracking-widest ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 h-px bg-outline-variant/40 ml-1" />
                </div>
              )}
              <button
                onClick={() => toggle(level.num)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                  isActive
                    ? "bg-primary-container text-on-primary-container border-l-4 border-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <MaterialIcon name={level.icon} className="text-[20px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium">{level.title}</div>
                  <div className="text-[11px] opacity-70 truncate font-mono uppercase tracking-wider">
                    Niveau {level.num} · {level.concepts.length}
                  </div>
                </div>
                <MaterialIcon
                  name="chevron_right"
                  className={`text-[18px] shrink-0 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {isExpanded && (
                <ul className="ml-3 pl-3 relative space-y-0.5 [&::before]:content-[''] [&::before]:absolute [&::before]:left-0 [&::before]:top-0 [&::before]:bottom-2 [&::before]:w-px [&::before]:bg-gradient-to-b [&::before]:from-accent/40 [&::before]:via-action/30 [&::before]:to-transparent">
                  {level.concepts.map((c, idx) => {
                    const realIdx =
                      CURRICULUM.find((l) => l.num === level.num)?.concepts.indexOf(c) ?? idx;
                    return (
                      <li key={`${level.num}.${realIdx}`}>
                        <button
                          onClick={() => pickAndMaybeClose(c, level)}
                          className="w-full text-left px-3 py-1.5 rounded-md text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors group"
                          title={c.en}
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-[10px] text-primary opacity-80 shrink-0">
                              {level.num}.{realIdx + 1}
                            </span>
                            <span className="truncate group-hover:text-on-surface">
                              {c.fr}
                            </span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant/60 ml-7 truncate">
                            {c.obj}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[13px] text-on-surface-variant">
            Aucun concept ne correspond à ce filtre.
          </div>
        )}
      </nav>

      {/* Footer minimaliste — juste la signature RAG local */}
      <div className="px-4 mt-auto pt-3 border-t border-outline-variant/20">
        <div className="text-[10px] font-mono text-on-surface-variant/60 text-center uppercase tracking-widest">
          RAG local · doc officielle
        </div>
      </div>
    </aside>
    </>
  );
}

function filterCurriculum(filter: string): Level[] {
  const f = filter.toLowerCase().trim();
  if (!f) return CURRICULUM;

  return CURRICULUM.map((level) => {
    const concepts = level.concepts.filter(
      (c) =>
        c.fr.toLowerCase().includes(f) ||
        c.obj.toLowerCase().includes(f) ||
        c.en.toLowerCase().includes(f),
    );
    return { ...level, concepts };
  }).filter((l) => l.concepts.length > 0);
}
