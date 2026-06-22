"use client";

import { useEffect, useState } from "react";

/**
 * Typewriter — affiche un texte caractère par caractère.
 * Démarre quand le composant est monté. Respecte prefers-reduced-motion
 * (affiche tout immédiatement). Le curseur final reste après l'animation.
 */

type Props = {
  text: string;
  /** Caractères par seconde. Défaut : 35. */
  speed?: number;
  /** Délai avant de démarrer en ms. Défaut : 0. */
  startDelay?: number;
  className?: string;
};

export function Typewriter({ text, speed = 35, startDelay = 0, className }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    let cancelled = false;
    const interval = 1000 / speed;
    let i = 0;
    const startTimer = setTimeout(function tick() {
      if (cancelled) return;
      i++;
      setShown(i);
      if (i < text.length) setTimeout(tick, interval);
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [text, speed, startDelay]);

  return <span className={className}>{text.slice(0, shown)}</span>;
}
