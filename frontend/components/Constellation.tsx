/**
 * Constellation — fond animé décoratif inspiré du mockup SVG officiel.
 *
 * Combine :
 *   - une couche d'étoiles statiques (de différentes tailles/opacités)
 *   - une couche d'étoiles qui clignotent (3 gradients : blanc, ambre, indigo)
 *   - des lignes de constellation qui se dessinent en boucle (stroke-dasharray)
 *
 * Le composant est purement décoratif (pointer-events: none, aria-hidden) et
 * respecte prefers-reduced-motion via la classe `.motion-safe` qui désactive
 * tous les `<animate*>` enfants.
 *
 * Le rendu est en pourcentages → s'adapte à n'importe quelle taille de
 * conteneur. Utiliser dans un parent en `position: relative`.
 */

import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Niveau de densité — 1 = épuré, 2 = standard, 3 = intense */
  density?: 1 | 2 | 3;
  uid?: string;
};

const STATIC_STARS: Array<[string, string, number, number]> = [
  ["10%", "20%", 1, 0.6],
  ["25%", "15%", 0.8, 0.4],
  ["40%", "30%", 1.2, 0.7],
  ["60%", "10%", 0.6, 0.5],
  ["75%", "25%", 1, 0.6],
  ["90%", "15%", 0.8, 0.4],
  ["15%", "70%", 1, 0.5],
  ["35%", "80%", 0.7, 0.6],
  ["55%", "75%", 1.1, 0.5],
  ["80%", "85%", 0.9, 0.4],
  ["95%", "60%", 1, 0.6],
  ["5%", "50%", 0.8, 0.5],
];

const TWINKLES: Array<[string, string, number, string, string]> = [
  ["20%", "40%", 1.5, "white", "3s"],
  ["70%", "50%", 1.5, "white", "4s"],
  ["50%", "60%", 1.5, "white", "2.5s"],
  ["85%", "35%", 1.2, "indigo", "3.5s"],
  ["30%", "55%", 1.2, "amber", "2.8s"],
];

const LINES: Array<[string, string, string, string, string, string]> = [
  ["20%", "40%", "35%", "30%", "#6366f1", "0s"],
  ["35%", "30%", "50%", "45%", "#6366f1", "0.5s"],
  ["50%", "45%", "70%", "50%", "#6366f1", "1s"],
  ["70%", "50%", "85%", "35%", "#6366f1", "1.5s"],
  ["20%", "40%", "30%", "55%", "#4f46e5", "2s"],
  ["30%", "55%", "50%", "60%", "#4f46e5", "2.5s"],
];

export function Constellation({ className, density = 2, uid = "constellation" }: Props) {
  const stars = STATIC_STARS.slice(0, density === 1 ? 6 : density === 2 ? 12 : STATIC_STARS.length);
  const twinkles = TWINKLES.slice(0, density === 1 ? 2 : density === 2 ? 4 : TWINKLES.length);
  const lines = density >= 2 ? LINES : [];

  const whiteGrad = `${uid}-white`;
  const amberGrad = `${uid}-amber`;
  const indigoGrad = `${uid}-indigo`;

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("constellation-star", className)}
    >
      <defs>
        <radialGradient id={whiteGrad}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={amberGrad}>
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={indigoGrad}>
          <stop offset="0%" stopColor="#818cf8" stopOpacity="1" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {stars.map(([cx, cy, r, op], i) => (
        <circle key={`s${i}`} cx={cx} cy={cy} r={r} fill="currentColor" opacity={op} />
      ))}

      {twinkles.map(([cx, cy, r, grad, dur], i) => {
        const fillId =
          grad === "white" ? whiteGrad : grad === "amber" ? amberGrad : indigoGrad;
        return (
          <circle key={`t${i}`} cx={cx} cy={cy} r={r} fill={`url(#${fillId})`}>
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              dur={dur}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}

      {lines.map(([x1, y1, x2, y2, stroke, begin], i) => (
        <line
          key={`l${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={stroke}
          strokeWidth="0.5"
          opacity="0.3"
          strokeDasharray="100"
          strokeDashoffset="100"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="100;0;0;100"
            dur="6s"
            begin={begin}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  );
}
