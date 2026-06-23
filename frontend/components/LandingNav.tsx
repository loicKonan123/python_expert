"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PolarisLogo } from "./PolarisLogo";
import { MaterialIcon } from "./MaterialIcon";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Nav de la landing avec :
 *   - logo + wordmark cliquables vers `/`
 *   - liens d'ancre (#concept, #comparaison) avec smooth scroll natif
 *   - section active détectée via IntersectionObserver (highlight ambre)
 *   - lien GitHub
 *   - CTA "Ouvrir Polaris"
 *   - apparition d'un fond glass plus opaque après quelques px de scroll
 *
 * Le tout est responsive — liens d'ancre cachés sous md.
 */

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "how", label: "Concept" },
  { id: "brand", label: "Identité" },
  { id: "comparison", label: "Comparaison" },
];

export function LandingNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Détecte la section actuellement la plus visible
  useEffect(() => {
    const elements = SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Fond plus opaque après scroll
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/60 border-b border-on-surface/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="px-gutter h-16 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          href="/"
          aria-label="Retour à l'accueil Polaris"
          className="flex items-center gap-2.5 group"
        >
          <PolarisLogo size={36} variant="animated" uid="nav" />
          <span className="text-[20px] font-semibold tracking-tight bg-gradient-to-br from-[#818cf8] to-accent bg-clip-text text-transparent group-hover:brightness-110 transition-all">
            Polaris
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {SECTIONS.map((s) => (
            <SectionLink
              key={s.id}
              id={s.id}
              label={s.label}
              active={activeId === s.id}
            />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com/loicKonan123/python_expert"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <MaterialIcon name="code" className="text-[16px]" />
            GitHub
          </a>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-action text-white text-[14px] font-medium shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            <span className="hidden sm:inline">Ouvrir Polaris</span>
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </Link>

          {/* Burger mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-on-surface/5 text-on-surface-variant"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <MaterialIcon name={mobileOpen ? "close" : "menu"} className="text-[22px]" />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={`md:hidden overflow-hidden border-t border-on-surface/10 transition-[max-height,opacity] duration-300 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-gutter py-3 space-y-1 bg-background/60 backdrop-blur-xl">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-[13px] font-mono uppercase tracking-widest transition-colors ${
                activeId === s.id
                  ? "text-accent bg-accent/5"
                  : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface"
              }`}
            >
              {s.label}
            </a>
          ))}
          <a
            href="https://github.com/loicKonan123/python_expert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface"
          >
            <MaterialIcon name="code" className="text-[16px]" />
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function SectionLink({
  id,
  label,
  active,
}: {
  id: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={`#${id}`}
      className={`relative px-3 py-1.5 text-[12px] font-mono uppercase tracking-widest transition-colors ${
        active
          ? "text-accent"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {label}
      <span
        className={`absolute left-3 right-3 -bottom-0.5 h-px bg-gradient-to-r from-accent/0 via-accent to-accent/0 transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </a>
  );
}
