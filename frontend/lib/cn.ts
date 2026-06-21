/**
 * cn — minimaliste class concatenation helper.
 * Évite de tirer `clsx`/`classnames` pour une seule utilité.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
