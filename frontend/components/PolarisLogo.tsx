/**
 * Logo Polaris — étoile polaire stylisée à 8 branches.
 *
 * Le mark évoque la rose des vents (navigation, guide) plus qu'une étoile
 * plate à 5 branches qui ferait penser à un rating. Les branches courtes
 * (NE/SE/SO/NO) sont légèrement plus claires pour suggérer la profondeur,
 * comme un compas vu de 3/4.
 *
 * Animation : un léger scintillement au hover via classe `polaris-twinkle`
 * définie dans globals.css. Désactivable pour les utilisateurs prefers-
 * reduced-motion.
 */
import { cn } from "@/lib/cn";

type Props = {
  size?: number;
  className?: string;
  /** Couleur principale (les 4 grandes branches). Défaut : currentColor. */
  primary?: string;
  /** Couleur secondaire (les 4 petites branches). Défaut : currentColor 60%. */
  secondary?: string;
  /** Animation au survol. Désactivée par défaut pour les usages d'arrière-plan. */
  twinkle?: boolean;
  title?: string;
};

export function PolarisLogo({
  size = 24,
  className,
  primary = "currentColor",
  secondary,
  twinkle = false,
  title = "Polaris",
}: Props) {
  const secondaryColor = secondary ?? primary;
  const secondaryOpacity = secondary ? 1 : 0.55;

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(twinkle && "polaris-twinkle", className)}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="polaris-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity="1" />
          <stop offset="60%" stopColor={primary} stopOpacity="0.85" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.65" />
        </radialGradient>
      </defs>

      {/* 4 petites branches (diagonales NE/SE/SO/NO) — apparaissent en fond */}
      <g
        fill={secondaryColor}
        opacity={secondaryOpacity}
        transform="rotate(45 16 16)"
      >
        <polygon points="16,4 17.4,16 16,28 14.6,16" />
        <polygon points="4,16 16,14.6 28,16 16,17.4" />
      </g>

      {/* 4 grandes branches (cardinales N/S/E/O) — au premier plan */}
      <g fill={primary}>
        <polygon points="16,2 18,16 16,30 14,16" />
        <polygon points="2,16 16,14 30,16 16,18" />
      </g>

      {/* Cœur lumineux — petit disque central avec gradient radial */}
      <circle cx="16" cy="16" r="2.5" fill="url(#polaris-core)" />
    </svg>
  );
}
