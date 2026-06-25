/**
 * Métadonnées visuelles partagées pour chaque corpus.
 * Sert à la Sidebar, aux Sources, aux badges dans les réponses bot.
 */
import type { Corpus } from "./curriculum";

export type CorpusMeta = {
  /** Nom affiché dans l'UI (capitalisé proprement). */
  label: string;
  /** Couleur d'accent (utilisée pour les badges, icônes, séparateurs). */
  color: string;
  /** Couleur de fond pour les badges (avec opacité). */
  bgColor: string;
  /** Icône Material Symbols. */
  icon: string;
};

export const CORPUS_META: Record<Corpus | "unknown", CorpusMeta> = {
  python: {
    label: "Python",
    color: "text-[#FFD43B]",
    bgColor: "bg-[#FFD43B]/15 border-[#FFD43B]/30",
    icon: "terminal",
  },
  fastapi: {
    label: "FastAPI",
    color: "text-[#009688]",
    bgColor: "bg-[#009688]/15 border-[#009688]/40",
    icon: "bolt",
  },
  pydantic: {
    label: "Pydantic",
    color: "text-[#E92063]",
    bgColor: "bg-[#E92063]/15 border-[#E92063]/40",
    icon: "schema",
  },
  nextjs: {
    label: "Next.js",
    color: "text-on-surface",
    bgColor: "bg-on-surface/10 border-on-surface/30",
    icon: "web",
  },
  typescript: {
    label: "TypeScript",
    color: "text-[#3178C6]",
    bgColor: "bg-[#3178C6]/15 border-[#3178C6]/40",
    icon: "code",
  },
  tailwind: {
    label: "Tailwind",
    color: "text-[#06B6D4]",
    bgColor: "bg-[#06B6D4]/15 border-[#06B6D4]/40",
    icon: "format_paint",
  },
  self: {
    label: "Mon code",
    color: "text-[#A78BFA]",
    bgColor: "bg-[#A78BFA]/15 border-[#A78BFA]/40",
    icon: "folder_code",
  },
  // ============ Phase 7 — Écosystème ============
  pytest: {
    label: "Pytest",
    color: "text-[#0A9EDC]",
    bgColor: "bg-[#0A9EDC]/15 border-[#0A9EDC]/40",
    icon: "bug_report",
  },
  httpx: {
    label: "HTTPX",
    color: "text-[#5E81AC]",
    bgColor: "bg-[#5E81AC]/15 border-[#5E81AC]/40",
    icon: "send_and_archive",
  },
  sqlalchemy: {
    label: "SQLAlchemy",
    color: "text-[#D71F00]",
    bgColor: "bg-[#D71F00]/15 border-[#D71F00]/40",
    icon: "database",
  },
  zod: {
    label: "Zod",
    color: "text-[#274D7F]",
    bgColor: "bg-[#274D7F]/15 border-[#274D7F]/40",
    icon: "shield",
  },
  tanstack_query: {
    label: "TanStack Query",
    color: "text-[#FF4154]",
    bgColor: "bg-[#FF4154]/15 border-[#FF4154]/40",
    icon: "sync",
  },
  vitest: {
    label: "Vitest",
    color: "text-[#FCC72B]",
    bgColor: "bg-[#FCC72B]/15 border-[#FCC72B]/40",
    icon: "speed",
  },
  // ============ Phase 12 — Front-end MDN ============
  html: {
    label: "HTML",
    color: "text-[#E34F26]",
    bgColor: "bg-[#E34F26]/15 border-[#E34F26]/40",
    icon: "html",
  },
  css: {
    label: "CSS",
    color: "text-[#1572B6]",
    bgColor: "bg-[#1572B6]/15 border-[#1572B6]/40",
    icon: "css",
  },
  javascript: {
    label: "JavaScript",
    color: "text-[#F7DF1E]",
    bgColor: "bg-[#F7DF1E]/15 border-[#F7DF1E]/40",
    icon: "javascript",
  },
  // ============ Phase 13 — Écosystème .NET ============
  csharp: {
    label: "C#",
    color: "text-[#9B82E6]",  // violet #512BD4 éclairci pour lisibilité dark
    bgColor: "bg-[#512BD4]/15 border-[#512BD4]/40",
    icon: "code_blocks",
  },
  aspnet: {
    label: "ASP.NET Core",
    color: "text-[#A88FE6]",
    bgColor: "bg-[#5C2D91]/15 border-[#5C2D91]/40",
    icon: "dns",
  },
  efcore: {
    label: "EF Core",
    color: "text-[#6FA9E6]",
    bgColor: "bg-[#1F2D5A]/20 border-[#1F2D5A]/50",
    icon: "storage",
  },
  unknown: {
    label: "Inconnu",
    color: "text-on-surface-variant",
    bgColor: "bg-surface-container-highest border-outline-variant",
    icon: "help",
  },
};

/** Récupère la meta d'un corpus, avec fallback safe. */
export function metaForCorpus(corpus: string): CorpusMeta {
  return CORPUS_META[corpus as Corpus] ?? CORPUS_META.unknown;
}
