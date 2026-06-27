"use client";

import { useEffect } from "react";

/**
 * Active le scroll-snap mandatory sur <html> uniquement quand monté.
 * À utiliser sur la landing — chaque <section className="snap-section">
 * occupe 1 viewport et le scroll verrouille section par section.
 *
 * Sur mobile (<768px) on désactive le snap pour ne pas frustrer la
 * navigation tactile.
 */
export function SnapScroll() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("snap-landing");
    return () => {
      html.classList.remove("snap-landing");
    };
  }, []);
  return null;
}
