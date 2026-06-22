"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Tilt3D — wrapper qui applique une rotation 3D fluide selon la position
 * du curseur dans l'élément. Pure CSS perspective + JS minimal (pas de lib).
 *
 * Effet : la carte s'incline vers le curseur comme si elle était posée sur
 * un axe 3D, avec un reflet de lumière qui suit le curseur (custom CSS
 * properties --mx / --my exposées au CSS pour un éventuel ::before).
 *
 * Désactivé automatiquement si l'utilisateur préfère reduced-motion (via
 * matchMedia côté handler, plus fiable que CSS pour les transforms).
 */

type Props = {
  children: ReactNode;
  className?: string;
  /** Amplitude max de rotation en degrés. Défaut : 8°. */
  maxTilt?: number;
  /** Échelle au hover (1 = aucune). Défaut : 1.02. */
  scale?: number;
};

export function Tilt3D({ children, className, maxTilt = 8, scale = 1.02 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 2 * maxTilt;
    const rotX = (0.5 - y) * 2 * maxTilt;
    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "transition-transform duration-200 ease-out will-change-transform",
        className,
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
