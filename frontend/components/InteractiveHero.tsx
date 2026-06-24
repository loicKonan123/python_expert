"use client";

import { useState } from "react";
import { PolarisLogo } from "./PolarisLogo";
import { HeroOrbits } from "./HeroOrbits";
import { MaterialIcon } from "./MaterialIcon";
import { Typewriter } from "./Typewriter";

/**
 * InteractiveHero — scène orbitale du hero avec 6 satellites cliquables.
 *
 * Chaque satellite représente un corpus indexé. Clic → la "démo card" sous
 * la constellation change pour montrer une vraie question + réponse Polaris
 * tirée de ce corpus. C'est la promesse du produit, montrée plutôt que dite.
 *
 * Le Polaris central reste en pointer-events-none pour que les clics
 * traversent. Les satellites sont des <button> stylés en glass card mini.
 */

type CorpusKey =
  | "python"
  | "fastapi"
  | "javascript"
  | "pydantic"
  | "nextjs"
  | "typescript"
  | "tailwind"
  | "html"
  | "css";

type Satellite = {
  key: CorpusKey;
  label: string;
  color: string;
  icon: string;
  /** Position % depuis le centre du conteneur (0,0 = top-left). */
  x: number;
  y: number;
  demo: {
    question: string;
    intro: string;
    code: string;
    source: string;
  };
};

// 9 satellites en 2 anneaux concentriques autour du logo Polaris central.
//
//   - Anneau INTÉRIEUR (3 satellites, rayon ~25%, 120° apart) : les 3
//     langages fondamentaux qui structurent l'écosystème.
//   - Anneau EXTÉRIEUR (6 satellites, rayon ~38%, 60° apart, offset 30°) :
//     les frameworks et libs.
//
// Trigonométrie : x = 50 + r·sin(θ), y = 50 - r·cos(θ) (θ depuis le nord,
// horaire). Origine top-left, y croît vers le bas (convention CSS).
const SATELLITES: Satellite[] = [
  // ━━━━━━━━━━━━━━━━ Anneau intérieur — trio langages ━━━━━━━━━━━━━━━━
  {
    key: "python",
    label: "Python",
    color: "#FFD43B",
    icon: "terminal",
    x: 50, y: 25,
    demo: {
      question: "Comment match-case un dataclass avec capture ?",
      intro: "Pattern guard sur un attribut :",
      code: `match shape:\n    case Circle(r) if r > 10:\n        print("grand cercle", r)\n    case Square(s):\n        print("carré", s)`,
      source: "docs.python.org/3.14/tutorial/controlflow.html#match",
    },
  },
  {
    key: "javascript",
    label: "JavaScript",
    color: "#F7DF1E",
    icon: "javascript",
    x: 28, y: 62,
    demo: {
      question: "Différence entre map et flatMap ?",
      intro: "flatMap = map + flat(1), plus efficace que la composition :",
      code: `const arr = [1, 2, 3];\n\narr.map(x => [x, x * 2]);\n// [[1, 2], [2, 4], [3, 6]]\n\narr.flatMap(x => [x, x * 2]);\n// [1, 2, 2, 4, 3, 6]`,
      source: "developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap",
    },
  },
  {
    key: "fastapi",
    label: "FastAPI",
    color: "#009688",
    icon: "bolt",
    x: 72, y: 62,
    demo: {
      question: "Streamer un SSE avec dependency injection ?",
      intro: "StreamingResponse + Depends :",
      code: `@app.get("/stream")\nasync def stream(svc: Service = Depends()):\n    return StreamingResponse(\n        svc.tokens(),\n        media_type="text/event-stream"\n    )`,
      source: "fastapi.tiangolo.com/advanced/custom-response/#streamingresponse",
    },
  },

  // ━━━━━━━━━━━━━━━━ Anneau extérieur — frameworks et libs ━━━━━━━━━━━━━━━━
  {
    key: "typescript",
    label: "TypeScript",
    color: "#3178C6",
    icon: "code",
    x: 32, y: 15,
    demo: {
      question: "Conditional type qui extrait le retour d'une route ?",
      intro: "infer dans une condition générique :",
      code: `type RouteReturn<R> =\n  R extends (...args: any[]) => Promise<infer T> ? T :\n  R extends (...args: any[]) => infer T          ? T :\n  never;`,
      source: "typescriptlang.org/docs/handbook/2/conditional-types.html",
    },
  },
  {
    key: "html",
    label: "HTML",
    color: "#E34F26",
    icon: "html",
    x: 68, y: 15,
    demo: {
      question: "Structure HTML5 sémantique d'une page de blog ?",
      intro: "Les balises de section dédiées (mieux qu'un océan de div) :",
      code: `<header>\n  <nav>…</nav>\n</header>\n<main>\n  <article>\n    <h1>Titre</h1>\n    <section>…</section>\n  </article>\n  <aside>Sidebar</aside>\n</main>\n<footer>…</footer>`,
      source: "developer.mozilla.org/en-US/docs/Web/HTML/Element/article",
    },
  },
  {
    key: "pydantic",
    label: "Pydantic",
    color: "#E92063",
    icon: "schema",
    x: 85, y: 50,
    demo: {
      question: "Validator async qui vérifie l'unicité d'un email ?",
      intro: "field_validator async avec accès DB :",
      code: `class UserCreate(BaseModel):\n    email: EmailStr\n\n    @field_validator("email")\n    async def unique(cls, v):\n        exists = await db.users.find_one({"email": v})\n        if exists:\n            raise ValueError("déjà pris")\n        return v`,
      source: "docs.pydantic.dev/latest/concepts/validators/#async-validators",
    },
  },
  {
    key: "nextjs",
    label: "Next.js",
    color: "#E2E8F0",
    icon: "web",
    x: 68, y: 85,
    demo: {
      question: "Server Action avec optimistic update ?",
      intro: "useOptimistic + 'use server' :",
      code: `const [opt, addOpt] = useOptimistic(items);\n\nasync function add(form: FormData) {\n  "use server";\n  await db.items.create({ name: form.get("n") });\n  revalidatePath("/");\n}`,
      source: "nextjs.org/docs/app/api-reference/functions/use-optimistic",
    },
  },
  {
    key: "tailwind",
    label: "Tailwind",
    color: "#06B6D4",
    icon: "format_paint",
    x: 32, y: 85,
    demo: {
      question: "Container queries en v4 ?",
      intro: "Plus de plugin, c'est natif :",
      code: `<div class="@container">\n  <p class="@md:text-xl @lg:text-2xl">\n    Suit la taille du conteneur\n  </p>\n</div>`,
      source: "tailwindcss.com/docs/responsive-design#container-queries",
    },
  },
  {
    key: "css",
    label: "CSS",
    color: "#1572B6",
    icon: "css",
    x: 15, y: 50,
    demo: {
      question: "Centrer un élément avec Flexbox ?",
      intro: "Le triplet justify + align + min-height :",
      code: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}`,
      source: "developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout",
    },
  },
];

export function InteractiveHero() {
  const [selectedKey, setSelectedKey] = useState<CorpusKey>("fastapi");
  const selected = SATELLITES.find((s) => s.key === selectedKey)!;

  return (
    <div className="glass-card-strong rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-[1.2fr_1fr]">
        {/* Colonne gauche — constellation interactive */}
        <div className="hero-scene relative h-[420px] lg:h-[520px] border-b lg:border-b-0 lg:border-r border-on-surface/10">
          <HeroOrbits />

          {/* Logo Polaris au centre */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <PolarisLogo size={170} variant="animated" uid="hero-mark" />
          </div>

          {/* Satellites cliquables */}
          {SATELLITES.map((sat) => {
            const isActive = sat.key === selectedKey;
            return (
              <button
                key={sat.key}
                onClick={() => setSelectedKey(sat.key)}
                style={{ left: `${sat.x}%`, top: `${sat.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all z-10 ${
                  isActive
                    ? "glass-card-strong text-on-surface z-20 scale-110 ring-1 ring-accent/40"
                    : "glass-card text-on-surface-variant hover:text-on-surface hover:scale-105"
                }`}
                title={`Voir la démo ${sat.label}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: sat.color }}
                />
                <span>{sat.label}</span>
              </button>
            );
          })}

          {/* Hint en bas de la constellation */}
          <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50 pointer-events-none">
            Clique une étoile pour explorer
          </div>
        </div>

        {/* Colonne droite — démo qui change selon le satellite sélectionné */}
        <div className="bg-on-surface/[0.02]">
          <DemoCard satellite={selected} />
        </div>
      </div>
    </div>
  );
}

function DemoCard({ satellite }: { satellite: Satellite }) {
  // Key sur satellite.key force le remount → Typewriter re-anime
  return (
    <div key={satellite.key} className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-on-surface/10 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: satellite.color }}
          />
          <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">
            Démo · {satellite.label}
          </span>
        </div>
        <span className="text-[10px] text-accent flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          live
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3 font-mono text-[12.5px] flex-1 min-h-0">
        {/* Question */}
        <div className="flex items-start gap-2">
          <MaterialIcon name="help" className="text-action text-[14px] mt-0.5 shrink-0" />
          <span className="text-on-surface">
            <Typewriter text={satellite.demo.question} speed={45} />
          </span>
        </div>

        {/* Réponse */}
        <div className="flex items-start gap-2 pt-1">
          <MaterialIcon name="auto_awesome" className="text-accent text-[14px] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="text-on-surface-variant">
              <Typewriter
                text={satellite.demo.intro}
                speed={55}
                startDelay={1200}
              />
            </div>
            <pre className="hero-code-preview rounded-lg p-3 text-action overflow-x-auto custom-scrollbar text-[11.5px] leading-[1.55]">
              <Typewriter
                text={satellite.demo.code}
                speed={65}
                startDelay={2200}
              />
            </pre>
            <div className="text-[11px] text-on-surface-variant/70 flex items-center gap-2 pt-1 min-w-0">
              <MaterialIcon name="link" className="text-[12px] shrink-0" />
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] max-w-full truncate"
                style={{
                  background: satellite.color + "22",
                  color: satellite.color,
                }}
                title={satellite.demo.source}
              >
                {satellite.demo.source}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
