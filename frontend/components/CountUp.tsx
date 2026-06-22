"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CountUp — anime un nombre de 0 → cible quand l'élément entre dans le viewport.
 *
 * Pure JS via IntersectionObserver + requestAnimationFrame, pas de lib.
 * Respecte prefers-reduced-motion : affiche directement la valeur cible.
 *
 * Le préfixe/suffixe (ex: "ms", "%", "M+") sont gérés par les props pour
 * permettre des formats variés sans parsing chiant.
 */

type Props = {
  to: number;
  /** Durée de l'animation en ms. Défaut : 1200ms. */
  duration?: number;
  /** Décimales à afficher. Défaut : 0. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function CountUp({
  to,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        function step(now: number) {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(eased * to);
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
