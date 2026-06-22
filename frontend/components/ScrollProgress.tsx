"use client";

import { useEffect, useState } from "react";

/**
 * Barre de progression de scroll fixée en haut de la page.
 * Largeur proportionnelle au pourcentage de scroll vertical.
 * Pure JS + CSS, pas de lib. Respecte prefers-reduced-motion (transition off).
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function read() {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const total = doc.scrollHeight - doc.clientHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    }
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-0.5 z-50 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-action to-accent shadow-[0_0_8px_rgba(99,102,241,0.5)] motion-safe:transition-[width] motion-safe:duration-100"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
