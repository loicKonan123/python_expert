/**
 * Polaris — logo officiel.
 *
 * Étoile à 8 branches (4 cardinales + 4 diagonales) avec un serpent Python
 * stylisé en cœur et un centre lumineux. Trois variantes :
 *
 *   - "animated" : version flagship (anneaux orbitaux contra-rotatifs, halo
 *     pulsant, rotation lente de l'étoile, scintillement du cœur). Utilisée
 *     sur la landing et au hover dans la TopBar.
 *   - "static" : même art mais sans animation, en gradient flat. Utilisée
 *     dans les listings, favicons applicatifs, OG image.
 *   - "mono" : monochrome adaptable au thème (currentColor). Utilisée à
 *     petite taille (sidebar, footer) et dans les contextes où le gradient
 *     surchargerait l'interface.
 *
 * L'animation respecte `prefers-reduced-motion` (les `<animate*>` sont
 * désactivés via CSS dans globals.css).
 */
import { cn } from "@/lib/cn";

type Variant = "animated" | "static" | "mono";

type Props = {
  size?: number;
  className?: string;
  variant?: Variant;
  /** Couleur pour la variante mono (défaut : currentColor). */
  color?: string;
  /** Active le hover scintillant (rotation + drop-shadow). */
  twinkle?: boolean;
  title?: string;
  /** ID unique requis quand plusieurs logos cohabitent sur la même page. */
  uid?: string;
};

export function PolarisLogo({
  size = 64,
  className,
  variant = "animated",
  color = "currentColor",
  twinkle = false,
  title = "Polaris",
  uid = "polaris",
}: Props) {
  if (variant === "mono") {
    return <MonoLogo size={size} className={className} color={color} twinkle={twinkle} title={title} />;
  }
  return (
    <FullLogo
      size={size}
      className={className}
      variant={variant}
      twinkle={twinkle}
      title={title}
      uid={uid}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Variante "mono" — petite, légère, sans gradient                            */
/* -------------------------------------------------------------------------- */
function MonoLogo({
  size,
  className,
  color,
  twinkle,
  title,
}: {
  size: number;
  className?: string;
  color: string;
  twinkle: boolean;
  title: string;
}) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(twinkle && "polaris-twinkle", className)}
    >
      <title>{title}</title>
      <g fill={color}>
        <path d="M100 20 L108 85 L170 92 L108 100 L100 165 L92 100 L30 92 L92 85 Z" />
        <path
          d="M100 45 L105 90 L145 95 L105 100 L100 145 L95 100 L55 95 L95 90 Z"
          opacity="0.5"
        />
      </g>
      {/* Serpent Python — trait dans la couleur de fond du conteneur */}
      <path
        d="M85 75 Q100 65 115 75 Q125 85 115 100 Q105 110 95 105 Q85 100 95 90 Q105 85 110 95"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.0"
      />
      <circle cx="100" cy="92" r="6" fill={color} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Variante "animated" / "static" — version flagship avec gradient + glow     */
/* -------------------------------------------------------------------------- */
function FullLogo({
  size,
  className,
  variant,
  twinkle,
  title,
  uid,
}: {
  size: number;
  className?: string;
  variant: "animated" | "static";
  twinkle: boolean;
  title: string;
  uid: string;
}) {
  const animated = variant === "animated";

  const gradId = `${uid}-star`;
  const glowGradId = `${uid}-glow`;
  const filterId = `${uid}-filter`;

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(twinkle && "polaris-twinkle", className)}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>
        <radialGradient id={glowGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo pulsant */}
      <circle cx="100" cy="100" r="90" fill={`url(#${glowGradId})`}>
        {animated && (
          <>
            <animate attributeName="r" values="85;95;85" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </>
        )}
      </circle>

      {/* Anneau extérieur — rotation sens horaire */}
      <circle
        cx="100"
        cy="100"
        r="80"
        fill="none"
        stroke="#6366f1"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="3 5"
      >
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="20s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Anneau moyen — rotation contraire */}
      <circle
        cx="100"
        cy="100"
        r="65"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        opacity="0.5"
        strokeDasharray="2 4"
      >
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 100 100"
            to="0 100 100"
            dur="15s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Étoile principale (8 branches : 4 cardinales + 4 diagonales) */}
      <g filter={`url(#${filterId})`}>
        <path
          d="M100 20 L108 85 L170 92 L108 100 L100 165 L92 100 L30 92 L92 85 Z"
          fill={`url(#${gradId})`}
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 100"
              to="360 100 100"
              dur="30s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path
          d="M100 45 L105 90 L145 95 L105 100 L100 145 L95 100 L55 95 L95 90 Z"
          fill={`url(#${gradId})`}
          opacity="0.7"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="45 100 100"
              to="405 100 100"
              dur="30s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Serpent Python au centre */}
      <g>
        <path
          d="M85 75 Q100 65 115 75 Q125 85 115 100 Q105 110 95 105 Q85 100 95 90 Q105 85 110 95"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          {animated && (
            <animate
              attributeName="stroke-dasharray"
              values="0 200;200 0"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <circle cx="115" cy="75" r="2.5" fill="#ffffff">
          {animated && (
            <animate
              attributeName="opacity"
              values="1;0.3;1"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>

      {/* Cœur lumineux pulsant */}
      <circle cx="100" cy="92" r="6" fill="#ffffff">
        {animated && (
          <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        )}
      </circle>
    </svg>
  );
}
