"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { resolveTheme, THEME_KEY, type ThemeMode } from "@/lib/theme";

/**
 * Bouton de bascule light/dark/system.
 * Clic = cycle dark -> light -> system -> dark.
 * L'attribut `data-theme` sur <html> est la source de vérité.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(THEME_KEY, mode);

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      document.documentElement.setAttribute(
        "data-theme",
        mq.matches ? "light" : "dark",
      );
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  function cycle() {
    setMode((m) => (m === "dark" ? "light" : m === "light" ? "system" : "dark"));
  }

  const icon =
    mode === "light" ? "light_mode" : mode === "dark" ? "dark_mode" : "computer";
  const label =
    mode === "light"
      ? "Thème clair"
      : mode === "dark"
        ? "Thème sombre"
        : "Thème système";

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
      title={`${label} — cliquer pour changer`}
      aria-label={label}
    >
      <MaterialIcon name={icon} />
    </button>
  );
}
