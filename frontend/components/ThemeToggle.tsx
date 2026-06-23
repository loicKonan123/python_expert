"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { THEME_KEY } from "@/lib/theme";

/**
 * Bouton de bascule light/dark — 2 états seulement.
 * Clic = toggle dark ↔ light. L'icône reflète le mode CIBLE après clic
 * (soleil quand on est en dark, lune quand on est en light).
 *
 * Persistance : on lit `data-theme` du DOM (déjà posé par le THEME_INIT_SCRIPT)
 * comme état initial. Évite la race condition de l'init React qui écrasait
 * la préférence avec "system" au premier render.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Hydratation : lit le data-theme actuel du DOM (posé par le script init).
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "light" ? "light" : "dark");
  }, []);

  // Application + persistance — skip tant que pas chargé.
  useEffect(() => {
    if (theme === null) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore quota / private mode */
    }
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const displayTheme = theme ?? "dark";
  // Icône = le mode VERS lequel on va aller au clic (clarifie l'action)
  const nextIcon = displayTheme === "dark" ? "light_mode" : "dark_mode";
  const label = displayTheme === "dark" ? "Passer en thème clair" : "Passer en thème sombre";

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
      title={label}
      aria-label={label}
      suppressHydrationWarning
    >
      <MaterialIcon name={nextIcon} />
    </button>
  );
}
