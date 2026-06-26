"use client";

/**
 * Icône de techno avec SVG officiel via simpleicons.org CDN.
 *
 * Slugs custom pour certaines technos qui n'ont pas de marque distincte
 * sur simpleicons (ex: pytest → on retombe sur un emoji / mat icon).
 *
 * Format d'URL : https://cdn.simpleicons.org/<slug>/<hex-color>
 */

type TechKey =
  | "python" | "fastapi" | "pydantic" | "sqlalchemy" | "httpx" | "pytest"
  | "nextjs" | "typescript" | "tailwind" | "zod" | "tanstack_query" | "vitest"
  | "html" | "css" | "javascript"
  | "csharp" | "aspnet" | "efcore"
  | "twelve_factor" | "docker" | "github_actions";

const SLUG: Record<TechKey, { slug: string; color: string } | { fallback: string; color: string }> = {
  python:         { slug: "python",        color: "FFD43B" },
  fastapi:        { slug: "fastapi",       color: "009688" },
  pydantic:       { slug: "pydantic",      color: "E92063" },
  sqlalchemy:     { slug: "sqlalchemy",    color: "D71F00" },
  httpx:          { fallback: "send",      color: "5E81AC" },
  pytest:         { slug: "pytest",        color: "0A9EDC" },
  nextjs:         { slug: "nextdotjs",     color: "FFFFFF" },
  typescript:     { slug: "typescript",    color: "3178C6" },
  tailwind:       { slug: "tailwindcss",   color: "06B6D4" },
  zod:            { slug: "zod",           color: "3B82C4" },
  tanstack_query: { slug: "reactquery",    color: "FF4154" },
  vitest:         { slug: "vitest",        color: "FCC72B" },
  html:           { slug: "html5",         color: "E34F26" },
  css:            { slug: "css",           color: "1572B6" },
  javascript:     { slug: "javascript",    color: "F7DF1E" },
  csharp:         { slug: "csharp",        color: "9B82E6" },
  aspnet:         { slug: "dotnet",        color: "A88FE6" },
  efcore:         { slug: "dotnet",        color: "6FA9E6" },
  twelve_factor:  { fallback: "view_module", color: "79589F" },
  docker:         { slug: "docker",        color: "2496ED" },
  github_actions: { slug: "githubactions", color: "9E91F2" },
};

type Props = {
  tech: TechKey;
  size?: number;
  className?: string;
};

export function TechIcon({ tech, size = 24, className = "" }: Props) {
  const entry = SLUG[tech];
  if (!entry) return null;

  if ("slug" in entry) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${entry.slug}/${entry.color}`}
        alt={tech}
        width={size}
        height={size}
        loading="lazy"
        className={className}
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      />
    );
  }

  // Fallback : Material Symbol coloré pour les technos sans icône simpleicons
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: size,
        color: `#${entry.color}`,
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
      }}
    >
      {entry.fallback}
    </span>
  );
}

/** Mapping label affichable → clé technique. */
export const TECH_LABELS: Record<TechKey, string> = {
  python: "Python 3.14",
  fastapi: "FastAPI",
  pydantic: "Pydantic v2",
  sqlalchemy: "SQLAlchemy",
  httpx: "httpx",
  pytest: "pytest",
  nextjs: "Next.js 16",
  typescript: "TypeScript 5",
  tailwind: "Tailwind v4",
  zod: "Zod",
  tanstack_query: "TanStack Query",
  vitest: "Vitest",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  csharp: "C#",
  aspnet: "ASP.NET Core",
  efcore: "EF Core",
  twelve_factor: "12 Factor App",
  docker: "Docker",
  github_actions: "GitHub Actions",
};

export type { TechKey };
