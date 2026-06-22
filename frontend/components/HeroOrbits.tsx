/**
 * HeroOrbits — scène orbitale décorative qui entoure le logo Polaris géant
 * du hero. Inspirée directement du SVG de marque envoyé par l'utilisateur :
 *
 *   - 3 ellipses orbitales (indigo / violet / gold) qui rotent à des vitesses
 *     différentes, certaines en sens horaire, d'autres en sens anti-horaire.
 *   - 6 étoiles satellites colorées qui scintillent à des fréquences variées
 *     et bougent légèrement (parallax orbital).
 *   - Lignes de connexion fade-in/out entre le centre et chaque satellite,
 *     en gradient codeGrad (indigo → gold).
 *   - 4 snippets Python flottants dans les coins (def, class, import, run)
 *     qui apparaissent et disparaissent en pulsation lente.
 *
 * Le composant est aria-hidden, purement décoratif, et respecte
 * prefers-reduced-motion (les <animate> sont neutralisés en CSS).
 *
 * Usage typique : placer ce composant dans un wrapper en position relative
 * derrière (ou autour de) le PolarisLogo. Le SVG est responsive et remplit
 * son conteneur.
 */

export function HeroOrbits() {
  return (
    <svg
      viewBox="0 0 1000 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ho-codeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ho-centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#4f46e5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <filter id="ho-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo central pulsant */}
      <circle cx="500" cy="200" r="150" fill="url(#ho-centerGlow)">
        <animate attributeName="r" values="140;165;140" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Orbites — 3 ellipses qui tournent à vitesses différentes */}
      <ellipse
        cx="500" cy="200" rx="200" ry="80"
        fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" strokeDasharray="4 6"
      >
        <animateTransform
          attributeName="transform" type="rotate"
          from="0 500 200" to="360 500 200" dur="30s" repeatCount="indefinite"
        />
      </ellipse>
      <ellipse
        cx="500" cy="200" rx="280" ry="110"
        fill="none" stroke="#4f46e5" strokeWidth="1" opacity="0.22" strokeDasharray="2 8"
      >
        <animateTransform
          attributeName="transform" type="rotate"
          from="360 500 200" to="0 500 200" dur="40s" repeatCount="indefinite"
        />
      </ellipse>
      <ellipse
        cx="500" cy="200" rx="360" ry="140"
        fill="none" stroke="var(--color-accent)" strokeWidth="0.8" opacity="0.18" strokeDasharray="3 10"
      >
        <animateTransform
          attributeName="transform" type="rotate"
          from="0 500 200" to="360 500 200" dur="50s" repeatCount="indefinite"
        />
      </ellipse>

      {/* Étoiles satellites — 6 points colorés qui scintillent + bougent un peu */}
      <g filter="url(#ho-glow)">
        <circle cx="300" cy="120" r="4" fill="#818cf8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
          <animate attributeName="cy" values="120;115;120" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="150" r="5" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;145;150" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="280" r="3.5" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="cx" values="200;205;200" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="800" cy="260" r="4" fill="#818cf8">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="cx" values="800;795;800" dur="5.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="320" r="3" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="620" cy="80" r="3.5" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Lignes de connexion du centre vers chaque satellite, fade in/out */}
      <g stroke="url(#ho-codeGrad)" strokeWidth="1" opacity="0.4">
        <line x1="500" y1="190" x2="300" y2="120">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="500" y1="190" x2="700" y2="150">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" begin="1s" repeatCount="indefinite" />
        </line>
        <line x1="500" y1="190" x2="200" y2="280">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" begin="2s" repeatCount="indefinite" />
        </line>
        <line x1="500" y1="190" x2="800" y2="260">
          <animate attributeName="opacity" values="0;0.6;0" dur="4s" begin="3s" repeatCount="indefinite" />
        </line>
        <line x1="500" y1="190" x2="400" y2="320">
          <animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="1.5s" repeatCount="indefinite" />
        </line>
        <line x1="500" y1="190" x2="620" y2="80">
          <animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="2.5s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Snippets Python flottants dans les coins — couleur adaptative au thème */}
      <g fontFamily="monospace" fontSize="14" fill="var(--color-on-surface-variant)">
        <text x="100" y="100" opacity="0.6">
          def polaris():
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
        </text>
        <text x="120" y="120" opacity="0.5">
          return excellence
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" begin="1s" repeatCount="indefinite" />
        </text>

        <text x="780" y="320" opacity="0.6">
          class Expert:
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" begin="2s" repeatCount="indefinite" />
        </text>
        <text x="800" y="340" opacity="0.5">
          python = True
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" begin="3s" repeatCount="indefinite" />
        </text>

        <text x="50" y="300" opacity="0.5">
          import polaris
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="6s" repeatCount="indefinite" />
        </text>
        <text x="850" y="80" opacity="0.5">
          {">>> run()"}
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="6s" begin="2s" repeatCount="indefinite" />
        </text>
      </g>
    </svg>
  );
}
