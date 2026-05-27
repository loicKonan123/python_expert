/**
 * Mini-parser markdown maison.
 * On extrait les blocs de code triple-backtick pour les rendre via Monaco
 * (composant React séparé), et on retourne une structure d'éléments inline
 * pour le reste (paragraphes, gras, code inline).
 *
 * Ce n'est pas un parser markdown complet — juste ce qu'on a besoin pour
 * les réponses du tuteur.
 */

export type MarkdownBlock =
  | { kind: "code"; lang: string; code: string }
  | { kind: "text"; text: string };

const CODE_FENCE = /```(\w+)?\n([\s\S]*?)```/g;

export function parseMarkdown(input: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let cursor = 0;

  for (const match of input.matchAll(CODE_FENCE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      const text = input.slice(cursor, start);
      if (text.trim()) blocks.push({ kind: "text", text });
    }
    blocks.push({
      kind: "code",
      lang: (match[1] || "python").toLowerCase(),
      code: match[2].replace(/\n$/, ""),
    });
    cursor = start + match[0].length;
  }

  if (cursor < input.length) {
    const text = input.slice(cursor);
    if (text.trim()) blocks.push({ kind: "text", text });
  }

  return blocks;
}

/**
 * Rendu HTML léger pour les blocs `text` :
 *   - **gras** -> <strong>
 *   - `code inline` -> <code>
 *   - Lignes commençant par # / ## / ### -> <strong>
 *   - Listes - / * -> <ul><li>
 * Tout le reste reste en texte brut (préservation des newlines via CSS pre-wrap).
 */
export function renderInlineMarkdown(text: string): string {
  let s = escapeHTML(text);
  // Headings -> bold (simplifié)
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>");
  // Gras
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // Code inline
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  return s;
}

function escapeHTML(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}
