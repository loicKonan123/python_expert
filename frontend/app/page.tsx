import Link from "next/link";
import { PolarisLogo } from "@/components/PolarisLogo";
import { MaterialIcon } from "@/components/MaterialIcon";

export const metadata = {
  title: "Polaris — Le tuteur dev qui ne ment pas",
  description:
    "Chaque réponse est citée dans la doc officielle de Python, FastAPI, Pydantic, Next.js, TypeScript et Tailwind. Le code généré peut être exécuté en direct.",
};

const CORPORA = [
  { label: "Python 3.14",     color: "#FFD43B" },
  { label: "FastAPI",         color: "#009688" },
  { label: "Pydantic v2",     color: "#E92063" },
  { label: "Next.js 16",      color: "#FFFFFF" },
  { label: "TypeScript 5",    color: "#3178C6" },
  { label: "Tailwind v4",     color: "#06B6D4" },
  { label: "pytest",          color: "#0A9EDC" },
  { label: "httpx",           color: "#6BC04B" },
  { label: "SQLAlchemy",      color: "#D71F00" },
  { label: "Zod",             color: "#3B82C4" },
  { label: "TanStack Query",  color: "#FF4154" },
  { label: "Vitest",          color: "#FCC72B" },
];

const USPS = [
  {
    icon: "verified",
    title: "Sourcé, jamais inventé",
    body: "Chaque affirmation pointe vers un extrait de la doc officielle, citable d'un clic. Pas d'hallucination, pas de version périmée.",
  },
  {
    icon: "play_circle",
    title: "Exécuté en direct",
    body: "Le code Python tourne dans un sandbox isolé avec kernel persistant. Tu lis, tu modifies, tu exécutes — sans quitter la conversation.",
  },
  {
    icon: "hub",
    title: "13 corpus, 28k chunks",
    body: "Du langage au front : Python, FastAPI, Pydantic, Next.js, TS, Tailwind, pytest, httpx, SQLAlchemy, Zod, TanStack Query, Vitest, et ton propre code.",
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav simplifiée */}
      <header className="px-gutter h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PolarisLogo
            size={28}
            primary="var(--color-primary-fixed-dim)"
            twinkle
          />
          <span className="text-[20px] font-semibold text-primary-fixed-dim tracking-tight">
            Polaris
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/loicKonan123/python_expert"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <MaterialIcon name="code" className="text-[16px]" />
            GitHub
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-primary to-[#3776ab] text-on-primary text-[14px] font-medium shadow-[0_8px_24px_rgba(152,203,255,0.25)] hover:brightness-110 transition-all"
          >
            Ouvrir Polaris
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-gutter pt-16 pb-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-[12px] font-mono uppercase tracking-widest text-on-surface-variant mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          RAG local · 13 corpus · sources citées
        </div>

        <h1 className="text-[clamp(40px,7vw,84px)] font-semibold tracking-tight leading-[1.05] mb-6">
          Le tuteur dev qui{" "}
          <span className="bg-gradient-to-br from-primary via-[#bb9af7] to-secondary bg-clip-text text-transparent">
            ne ment pas.
          </span>
        </h1>

        <p className="text-[18px] sm:text-[20px] text-on-surface-variant max-w-2xl mx-auto leading-[1.6] mb-10">
          Polaris répond à tes questions de dev full-stack en{" "}
          <span className="text-on-surface">citant la doc officielle</span>{" "}
          ligne par ligne — et exécute son code Python pour te montrer qu'il
          marche vraiment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-[#3776ab] text-on-primary text-[15px] font-medium shadow-[0_12px_32px_rgba(152,203,255,0.35)] hover:brightness-110 transition-all"
          >
            <MaterialIcon name="rocket_launch" className="text-[20px]" />
            Commencer maintenant
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-card text-[15px] text-on-surface hover:bg-white/10 transition-colors"
          >
            <MaterialIcon name="play_circle" className="text-[20px]" />
            Comment ça marche
          </a>
        </div>
      </section>

      {/* Bandeau corpus */}
      <section className="px-gutter pb-24 max-w-6xl mx-auto w-full">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/70 text-center mb-5">
          Sources officielles indexées
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {CORPORA.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[12px] font-mono"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: c.color }}
              />
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* USPs */}
      <section id="how" className="px-gutter pb-24 max-w-6xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USPS.map((u) => (
            <article
              key={u.title}
              className="glass-card-strong p-6 rounded-2xl space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-[#bb9af7]/30 flex items-center justify-center">
                <MaterialIcon
                  name={u.icon}
                  filled
                  className="text-primary-fixed-dim text-[22px]"
                />
              </div>
              <h2 className="text-[18px] font-semibold text-on-surface">
                {u.title}
              </h2>
              <p className="text-[14px] text-on-surface-variant leading-[1.6]">
                {u.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-gutter pb-24 max-w-3xl mx-auto w-full text-center">
        <div className="glass-card-strong p-10 rounded-3xl space-y-5">
          <PolarisLogo
            size={56}
            primary="var(--color-primary-fixed-dim)"
            twinkle
            className="mx-auto"
          />
          <h2 className="text-[28px] font-semibold tracking-tight">
            Prêt à coder avec une vraie boussole ?
          </h2>
          <p className="text-on-surface-variant">
            Aucune inscription. Aucune télémétrie. Tout tourne en local sauf
            l'API de complétion (clé optionnelle).
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-[#3776ab] text-on-primary text-[15px] font-medium shadow-[0_12px_32px_rgba(152,203,255,0.35)] hover:brightness-110 transition-all"
          >
            <MaterialIcon name="arrow_forward" />
            Ouvrir Polaris
          </Link>
        </div>
      </section>

      <footer className="px-gutter py-6 border-t border-white/5 text-center text-[12px] font-mono uppercase tracking-widest text-on-surface-variant/60">
        Polaris · RAG local · doc officielle
      </footer>
    </main>
  );
}
