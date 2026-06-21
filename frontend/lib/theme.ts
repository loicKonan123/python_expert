/**
 * Polaris — gestion du thème light/dark.
 *
 * Le thème est stocké dans localStorage sous la clé `polaris-theme`, avec
 * 3 valeurs possibles : "light", "dark", "system" (suit prefers-color-scheme).
 *
 * Le script inline injecté dans <head> (voir layout.tsx) applique le thème
 * AVANT le premier paint, ce qui évite le flash FOUC sur les sessions où
 * l'utilisateur a choisi light. La source de vérité au runtime reste
 * l'attribut `data-theme` sur <html>.
 */

export type ThemeMode = "light" | "dark" | "system";
export const THEME_KEY = "polaris-theme";

/** Script à injecter via dangerouslySetInnerHTML dans <head>. */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var k = ${JSON.stringify(THEME_KEY)};
    var saved = localStorage.getItem(k);
    var sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    var theme = (saved === 'light' || saved === 'dark') ? saved : sys;
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return mode;
}
