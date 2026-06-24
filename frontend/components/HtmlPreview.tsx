"use client";

import { useMemo } from "react";

/**
 * Aperçu HTML/CSS/JS rendu dans une iframe sandboxée.
 *
 * Stratégie d'assemblage :
 *  - lang = "html" → le code est utilisé tel quel comme document complet
 *    (si pas de <!DOCTYPE>, on en ajoute un, mais on ne touche pas au body)
 *  - lang = "css" → on enveloppe dans un document HTML avec un placeholder
 *    visuel (h1, p, button) auquel le CSS s'applique
 *  - lang = "javascript" / "js" → on enveloppe dans un HTML avec une <div
 *    id="app"> + console mirror visible (la JS peut écrire dedans)
 *
 * Tailwind CDN est toujours injecté dans le <head> de l'iframe :
 *   - Pour les démos HTML, l'utilisateur peut utiliser directement les
 *     classes Tailwind sans config
 *   - Pour les démos CSS, ça ne pollue pas le CSS utilisateur (le ::before
 *     du LLM gagne en spécificité)
 *
 * L'iframe est `sandbox="allow-scripts"` — le JS du code utilisateur peut
 * tourner mais ne peut pas accéder à `parent`, `top`, ou faire fetch
 * cross-origin.
 */

type Props = {
  /** Le code utilisateur. */
  code: string;
  /** Langue détectée par le CodeBlock parent. */
  lang: "html" | "css" | "javascript" | "js";
  /** Hauteur de l'iframe en pixels. Défaut : 360. */
  height?: number;
};

const TAILWIND_CDN_TAG =
  '<script src="https://cdn.tailwindcss.com"></script>';

const BASE_STYLE_TAG = `
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; }
  .polaris-console { font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 12.5px; background: #0b1226; color: #cbd5e1; padding: 12px; border-radius: 8px; margin-top: 16px; min-height: 60px; white-space: pre-wrap; }
  .polaris-console:empty::before { content: 'console.log() apparaîtra ici…'; color: #475569; font-style: italic; }
  .polaris-demo h1 { color: #0ea5e9; margin: 0 0 8px; }
</style>
`;

const CONSOLE_SHIM = `
<script>
  (function() {
    var box = document.getElementById('polaris-console');
    if (!box) return;
    var orig = { log: console.log.bind(console), error: console.error.bind(console), warn: console.warn.bind(console) };
    function fmt(args) { return Array.from(args).map(function(a) { try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); } catch(e) { return String(a); } }).join(' '); }
    console.log = function() { box.textContent += fmt(arguments) + '\\n'; orig.log.apply(null, arguments); };
    console.warn = function() { box.textContent += '⚠ ' + fmt(arguments) + '\\n'; orig.warn.apply(null, arguments); };
    console.error = function() { box.textContent += '✗ ' + fmt(arguments) + '\\n'; orig.error.apply(null, arguments); };
    window.addEventListener('error', function(e) { box.textContent += '✗ ' + (e.error ? e.error.stack || e.error.message : e.message) + '\\n'; });
  })();
</script>
`;

function buildDocument(code: string, lang: Props["lang"]): string {
  if (lang === "html") {
    // Si le code commence déjà par <!DOCTYPE> ou <html>, on injecte juste
    // le tag Tailwind après <head> (ou en début si pas de head).
    const trimmed = code.trim();
    const hasDoctype = /^<!doctype/i.test(trimmed);
    const hasHtml = /<html[\s>]/i.test(trimmed);

    if (hasDoctype || hasHtml) {
      // On injecte Tailwind dans le <head> existant, ou avant </head>, ou
      // juste après <html>. Si rien, on prepend.
      if (/<head[^>]*>/i.test(trimmed)) {
        return trimmed.replace(/<head[^>]*>/i, (m) => `${m}\n${TAILWIND_CDN_TAG}`);
      }
      return trimmed.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${TAILWIND_CDN_TAG}</head>`);
    }

    // Sinon on enveloppe le fragment dans un document complet.
    return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    ${TAILWIND_CDN_TAG}
    ${BASE_STYLE_TAG}
  </head>
  <body>
    ${code}
  </body>
</html>`;
  }

  if (lang === "css") {
    return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    ${TAILWIND_CDN_TAG}
    <style>${code}</style>
  </head>
  <body class="polaris-demo">
    <h1>Aperçu du CSS</h1>
    <p>Ce paragraphe est un placeholder pour visualiser les styles.</p>
    <button>Un bouton</button>
    <ul><li>Élément 1</li><li>Élément 2</li><li>Élément 3</li></ul>
    <div class="card">Un div avec classe <code>.card</code></div>
  </body>
</html>`;
  }

  // lang = "javascript" / "js"
  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    ${TAILWIND_CDN_TAG}
    ${BASE_STYLE_TAG}
  </head>
  <body>
    <div id="app"></div>
    <div id="polaris-console" class="polaris-console"></div>
    ${CONSOLE_SHIM}
    <script>
    try {
${code}
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
    }
    </script>
  </body>
</html>`;
}

export function HtmlPreview({ code, lang, height = 360 }: Props) {
  const doc = useMemo(() => buildDocument(code, lang), [code, lang]);

  return (
    <iframe
      srcDoc={doc}
      className="w-full bg-white border-t border-on-surface/10"
      style={{ height }}
      sandbox="allow-scripts"
      title={`Aperçu ${lang}`}
    />
  );
}

/** Indique si le langage est rendable par HtmlPreview. */
export function isPreviewable(lang: string | undefined): lang is Props["lang"] {
  if (!lang) return false;
  const k = lang.toLowerCase();
  return k === "html" || k === "css" || k === "javascript" || k === "js";
}
