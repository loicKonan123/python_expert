"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

/**
 * Bouton flottant en bas à droite qui apparaît après 600px de scroll.
 * Clic → smooth scroll vers le haut. Respecte prefers-reduced-motion
 * (jump immédiat si l'utilisateur préfère limiter les animations).
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function backToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={backToTop}
      aria-label="Retour en haut"
      className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center
        bg-action text-white
        shadow-[0_10px_40px_-10px_rgba(99,102,241,0.7)]
        hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300
        ${visible ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-4"}`}
    >
      <MaterialIcon name="arrow_upward" />
    </button>
  );
}
