"use client";

import { useEffect, useState } from "react";

/**
 * Lit l'attribut `data-theme` de <html> et le suit en réactif.
 * Utilisé par Monaco pour switcher entre `vs-dark` et `vs` (light).
 */
export function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const read = () =>
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "dark";
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
