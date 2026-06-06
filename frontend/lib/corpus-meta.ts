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
