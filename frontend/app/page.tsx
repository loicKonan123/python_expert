import Link from "next/link";
import { PolarisLogo } from "@/components/PolarisLogo";
import { Constellation } from "@/components/Constellation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Tilt3D } from "@/components/Tilt3D";
import { Reveal } from "@/components/Reveal";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CountUp } from "@/components/CountUp";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LandingNav } from "@/components/LandingNav";
import { InteractiveHero } from "@/components/InteractiveHero";

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
  { label: "HTML",            color: "#E34F26" },
  { label: "CSS",             color: "#1572B6" },
  { label: "JavaScript",      color: "#F7DF1E" },
];

export default function Landing() {
  return (
    <main className="relative min-h-screen flex flex-col tech-grid overflow-x-hidden">
      <ScrollProgress />
      <ScrollToTop />
      <LandingNav />

      {/* Hero — copie centrée en haut, panneau interactif plein largeur dessous */}
      <section className="relative px-gutter pt-10 pb-20 max-w-6xl mx-auto">
        <Constellation
          className="absolute inset-0 -z-10 pointer-events-none"
          density={3}
          uid="hero"
        />
        <ParticlesLayer />

        {/* Copie centrée */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-[clamp(40px,6.5vw,80px)] font-extrabold tracking-[-0.02em] leading-[1.02] mb-5">
            Le tuteur dev qui<br />
            <span className="text-accent">ne ment pas.</span>
          </h1>

          <p className="text-[17px] sm:text-[19px] text-on-surface-variant leading-[1.55] mb-8 max-w-2xl mx-auto">
            Chaque réponse est{" "}
            <span className="text-on-surface font-medium">
              citée dans la doc officielle
            </span>
            . Chaque ligne de Python est{" "}
            <span className="text-on-surface font-medium">
              exécutée en sandbox
            </span>
            . Zéro hallucination.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-action text-white text-[15px] font-semibold shadow-[0_10px_30px_-8px_rgba(99,102,241,0.5)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
            >
              <MaterialIcon name="rocket_launch" className="text-[18px]" />
              Commencer
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-[15px] text-on-surface hover:border-action/40 hover:bg-surface-container transition-colors"
            >
              Voir la démo
            </a>
          </div>
        </div>

        {/* Panneau interactif plein largeur — constellation + démo côte à côte */}
        <InteractiveHero />
      </section>

      {/* Bandeau stats */}
      <Reveal>
        <section className="px-gutter pb-20 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Truth accuracy" color="var(--color-accent)">
              <CountUp to={99.8} decimals={1} suffix="%" />
            </Stat>
            <Stat label="Inference delay" color="var(--color-on-surface)">
              <CountUp to={0} suffix="ms" />
            </Stat>
            <Stat label="Corpus indexés" color="var(--color-action)">
              <CountUp to={16} />
            </Stat>
            <Stat label="Chunks indexés" color="var(--color-on-surface)">
              <CountUp to={47094} duration={1800} />
            </Stat>
          </div>
        </section>
      </Reveal>

      {/* Bento grid USPs — style Stitch (7+5+12) */}
      <section id="how" className="px-gutter pb-24 max-w-6xl mx-auto w-full">
        <Reveal>
          <SectionHeader
            kicker="Comment ça marche"
            title="Trois piliers, aucun compromis"
            subtitle="Polaris ne se contente pas de générer du texte. Il cite, il exécute, il croise les sources."
          />
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1 — Sourced (col-span-7) avec mini badges */}
          <Reveal delay={0} className="md:col-span-7">
            <Tilt3D className="h-full" maxTilt={6}>
              <article className="glass-card-strong h-full p-7 rounded-3xl space-y-4 hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1]/30 to-accent/20 flex items-center justify-center">
                  <MaterialIcon name="verified" filled className="text-action text-[24px]" />
                </div>
                <h2 className="text-[22px] font-semibold text-on-surface">
                  Sourcé, jamais inventé
                </h2>
                <p className="text-[14px] text-on-surface-variant leading-[1.6]">
                  Chaque affirmation pointe vers un extrait de la doc officielle,
                  citable d'un clic. Pas d'hallucination, pas de version périmée.
                </p>
                {/* Mini widget : barres de couverture des 3 plus gros corpus */}
                <div className="space-y-2 pt-2">
                  <CoverageBar label="Python 3.14" pct={92} color="#FFD43B" />
                  <CoverageBar label="FastAPI" pct={88} color="#009688" />
                  <CoverageBar label="Next.js 16" pct={84} color="#FFFFFF" />
                </div>
              </article>
            </Tilt3D>
          </Reveal>

          {/* Card 2 — Executed live (col-span-5) avec code window */}
          <Reveal delay={120} className="md:col-span-5">
            <Tilt3D className="h-full" maxTilt={6}>
              <article className="glass-card-strong h-full p-7 rounded-3xl space-y-4 hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-[#818cf8]/20 flex items-center justify-center">
                  <MaterialIcon name="play_circle" filled className="text-accent text-[24px]" />
                </div>
                <h2 className="text-[22px] font-semibold text-on-surface">
                  Exécuté en direct
                </h2>
                <p className="text-[14px] text-on-surface-variant leading-[1.6]">
                  Le code Python tourne dans un sandbox isolé avec kernel
                  persistant. Tu lis, modifies, exécutes — sans quitter le chat.
                </p>
                <MiniCodeWindow />
              </article>
            </Tilt3D>
          </Reveal>

          {/* Card 3 — Multi-corpus (col-span-12) avec belt animé */}
          <Reveal delay={240} className="md:col-span-12">
            <Tilt3D className="h-full" maxTilt={3}>
              <article className="glass-card-strong p-7 rounded-3xl space-y-5 hover:border-accent/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#818cf8]/30 to-[#6366f1]/20 flex items-center justify-center shrink-0">
                    <MaterialIcon name="hub" filled className="text-action text-[24px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[22px] font-semibold text-on-surface">
                      16 corpus indexés
                    </h2>
                    <p className="text-[14px] text-on-surface-variant leading-[1.6] mt-1">
                      Du langage au front, de l'ORM aux tests : Polaris pioche
                      simultanément dans toutes les docs officielles (Python,
                      FastAPI, Pydantic, Next.js, TypeScript, Tailwind, pytest,
                      httpx, SQLAlchemy, Zod, TanStack Query, Vitest, HTML, CSS,
                      JavaScript MDN) + ton propre code via le corpus{" "}
                      <span className="text-accent font-mono">self</span>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CORPORA.map((c, i) => (
                    <Reveal key={c.label} delay={i * 30} translateY={8}>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[12px] font-mono">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.label}
                      </span>
                    </Reveal>
                  ))}
                </div>
              </article>
            </Tilt3D>
          </Reveal>
        </div>
      </section>

      {/* Showcase identité — 3 variantes du logo */}
      <Reveal>
        <section id="brand" className="px-gutter pb-24 max-w-5xl mx-auto w-full">
          <SectionHeader
            kicker="Identité"
            title="Une étoile, trois visages"
            subtitle="Le logo Polaris représente l'étoile polaire — ton point de repère dans l'univers du code. Animée pour les surfaces vivantes, statique pour la sobriété, monochrome pour le contexte."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <LogoVariantCard variant="animated" label="Animée" sub="Hero · CTA · landing" />
            <LogoVariantCard variant="static" label="Statique" sub="Listings · OG · favicon" />
            <LogoVariantCard variant="mono" label="Monochrome" sub="Sidebar · footer · inline" />
          </div>
        </section>
      </Reveal>

      {/* Comparaison */}
      <Reveal>
        <section id="comparison" className="px-gutter pb-24 max-w-5xl mx-auto w-full">
          <SectionHeader
            kicker="Comparaison"
            title="Polaris vs LLM générique"
            subtitle="La même question. Deux postures radicalement différentes."
          />
          <ComparisonTable />
        </section>
      </Reveal>

      {/* CTA final */}
      <Reveal>
      <section className="px-gutter pb-24 max-w-3xl mx-auto w-full text-center">
        <Tilt3D maxTilt={6}>
        <div className="glass-card-strong p-10 rounded-3xl space-y-5">
          <div className="flex justify-center">
            <PolarisLogo size={80} variant="animated" uid="cta" />
          </div>
          <h2 className="text-[28px] font-semibold tracking-tight">
            Prêt à coder avec une vraie boussole ?
          </h2>
          <p className="text-on-surface-variant">
            Aucune inscription. Aucune télémétrie. Tout tourne en local sauf
            l'API de complétion (clé optionnelle).
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-action text-white text-[15px] font-semibold shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            <MaterialIcon name="arrow_forward" />
            Ouvrir Polaris
          </Link>
        </div>
        </Tilt3D>
      </section>
      </Reveal>

      <FooterLanding />

    </main>
  );
}

/** En-tête de section — kicker (label ambre), titre gradient, sous-titre. */
function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <p className="text-[11px] font-mono uppercase tracking-widest text-accent mb-3">
        {kicker}
      </p>
      <h2 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight leading-tight text-on-surface">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[15px] text-on-surface-variant max-w-2xl mx-auto leading-[1.6]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Carte d'une variante de logo — gros logo centré + label + tagline. */
function LogoVariantCard({
  variant,
  label,
  sub,
}: {
  variant: "animated" | "static" | "mono";
  label: string;
  sub: string;
}) {
  return (
    <Tilt3D maxTilt={6}>
      <article className="glass-card-strong h-full p-6 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-accent/30 transition-colors">
        <div className="w-32 h-32 flex items-center justify-center">
          <PolarisLogo
            size={120}
            variant={variant}
            color={variant === "mono" ? "var(--color-primary-fixed-dim)" : undefined}
            uid={`variant-${variant}`}
          />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-on-surface">{label}</h3>
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/70 mt-1">
            {sub}
          </p>
        </div>
      </article>
    </Tilt3D>
  );
}

/** Table comparant Polaris à un LLM générique, ligne par ligne. */
function ComparisonTable() {
  const rows: Array<{ feature: string; polaris: string; generic: string }> = [
    {
      feature: "Sources citées",
      polaris: "Chaque ligne pointe vers la doc officielle",
      generic: "Affirmations sans source vérifiable",
    },
    {
      feature: "Code Python",
      polaris: "Exécuté en sandbox + kernel persistant",
      generic: "Texte non vérifié, à copier-coller",
    },
    {
      feature: "Versions",
      polaris: "Python 3.14, Next.js 16, Tailwind v4",
      generic: "Souvent périmées (knowledge cutoff)",
    },
    {
      feature: "Corpus",
      polaris: "13 sources spécialisées (28 367 chunks)",
      generic: "Données génériques mélangées",
    },
    {
      feature: "Vie privée",
      polaris: "Indexation locale, pas de télémétrie",
      generic: "Données envoyées au fournisseur",
    },
  ];

  return (
    <Tilt3D maxTilt={3}>
      <div className="glass-card-strong rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-on-surface/10 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">
          <div className="col-span-4">Critère</div>
          <div className="col-span-4 text-accent flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Polaris
          </div>
          <div className="col-span-4">LLM générique</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.feature}
            className={`grid grid-cols-12 px-6 py-4 text-[14px] ${
              i < rows.length - 1 ? "border-b border-on-surface/10" : ""
            }`}
          >
            <div className="col-span-4 text-on-surface font-medium">{r.feature}</div>
            <div className="col-span-4 flex items-start gap-2 text-on-surface">
              <span className="text-green-400 mt-0.5 shrink-0">✓</span>
              {r.polaris}
            </div>
            <div className="col-span-4 flex items-start gap-2 text-on-surface-variant">
              <span className="text-error mt-0.5 shrink-0">✗</span>
              {r.generic}
            </div>
          </div>
        ))}
      </div>
    </Tilt3D>
  );
}

/** Footer expansif 4 colonnes inspiré de la light landing Stitch. */
function FooterLanding() {
  return (
    <footer className="mt-20 border-t border-on-surface/10 px-gutter py-12 max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <Link
            href="/"
            aria-label="Retour à l'accueil Polaris"
            className="flex items-center gap-2 group w-fit"
          >
            <PolarisLogo size={28} variant="animated" uid="footer" />
            <span className="text-[18px] font-semibold tracking-tight bg-gradient-to-br from-[#818cf8] to-accent bg-clip-text text-transparent group-hover:brightness-110 transition-all">
              Polaris
            </span>
          </Link>
          <p className="text-[12px] text-on-surface-variant/70 leading-[1.5] max-w-xs">
            Le tuteur dev qui ne ment pas. Chaque réponse est sourcée, chaque
            code est exécuté.
          </p>
        </div>

        <FooterCol
          title="Produit"
          links={[
            { label: "Application", href: "/app" },
            { label: "Curriculum", href: "/app" },
            { label: "Sandbox", href: "/app" },
          ]}
        />
        <FooterCol
          title="Projet"
          links={[
            { label: "GitHub", href: "https://github.com/loicKonan123/python_expert" },
            { label: "Roadmap", href: "https://github.com/loicKonan123/python_expert/blob/main/docs/plan.md" },
            { label: "Changelog", href: "https://github.com/loicKonan123/python_expert/commits/main" },
          ]}
        />
        <FooterCol
          title="Légal"
          links={[
            { label: "Confidentialité", href: "#" },
            { label: "Conditions", href: "#" },
            { label: "Licence", href: "#" },
          ]}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-on-surface/10 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60">
        <span>v1.0.0 · © 2026 Polaris Engineering</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400/80">Systems operational</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-[12px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Statistique clé du bandeau hero — chiffre coloré + label monospace. */
function Stat({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 text-center">
      <div
        className="text-[28px] sm:text-[34px] font-extrabold leading-none tabular-nums"
        style={{ color }}
      >
        {children}
      </div>
      <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </div>
    </div>
  );
}

/** Barre de couverture pour mini-widget — label + barre proportionnelle. */
function CoverageBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-surface-container-low/50 p-2.5 rounded-lg border border-outline-variant/20">
      <span className="font-mono text-[11px] text-on-surface w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1 bg-on-surface/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-[10px] text-on-surface-variant/70 shrink-0">
        {pct}%
      </span>
    </div>
  );
}

/** Mini fenêtre de code décorative — chrome macOS + 4 lignes Python colorées. */
function MiniCodeWindow() {
  return (
    <div className="hero-code-preview rounded-xl p-3 font-mono text-[12px] border border-outline-variant/30 shadow-2xl">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-[10px] text-on-surface-variant/60">
          sandbox.py
        </span>
        <span className="text-[10px] text-accent flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          run
        </span>
      </div>
      <code className="block text-action">from polaris import truth</code>
      <code className="block text-accent">result = truth.cite(query)</code>
      <code className="block text-on-surface pl-3">→ ["python.org/3/...", ...]</code>
      <code className="block text-action">assert no_hallucination</code>
    </div>
  );
}

/** Couche de 12 particules réparties horizontalement avec délais variés. */
function ParticlesLayer() {
  const particles = [
    { left: "8%",  color: "var(--color-accent)", dur: "9s",  delay: "0s" },
    { left: "16%", color: "#818cf8", dur: "11s", delay: "1.5s" },
    { left: "24%", color: "#818cf8", dur: "8s",  delay: "3s" },
    { left: "32%", color: "var(--color-accent)", dur: "10s", delay: "0.8s" },
    { left: "42%", color: "#818cf8", dur: "12s", delay: "2.2s" },
    { left: "50%", color: "var(--color-accent)", dur: "9s",  delay: "4s" },
    { left: "58%", color: "#818cf8", dur: "11s", delay: "1.2s" },
    { left: "66%", color: "#818cf8", dur: "8s",  delay: "3.5s" },
    { left: "76%", color: "var(--color-accent)", dur: "10s", delay: "2s" },
    { left: "84%", color: "#818cf8", dur: "12s", delay: "0.5s" },
    { left: "92%", color: "#818cf8", dur: "9s",  delay: "4.5s" },
    { left: "96%", color: "var(--color-accent)", dur: "11s", delay: "3.2s" },
  ];
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="polaris-particle"
          style={
            {
              "--p-left": p.left,
              "--p-color": p.color,
              "--p-dur": p.dur,
              "--p-delay": p.delay,
              bottom: "20%",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
