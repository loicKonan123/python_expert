"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Reveal — révèle son contenu en fade + translate quand il entre dans le
 * viewport. Basé sur IntersectionObserver (zéro lib). Respecte
 * prefers-reduced-motion (les animations sont court-circuitées).
 *
 * `delay` permet de créer un effet "staggered" sur une grille de cartes.
 */

type Props = {
  children: ReactNode;
  className?: string;
  /** Délai d'apparition en ms (utile pour staggered). Défaut : 0. */
  delay?: number;
  /** Amplitude vertical de l'entrée en px. Défaut : 24. */
  translateY?: number;
};

export function Reveal({ children, className, delay = 0, translateY = 24 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : `translateY(${translateY}px)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
