/**
 * Wrapper pour les Material Symbols Outlined.
 * On charge la police via le <head> dans layout.tsx (link Google Fonts).
 */
type Props = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function MaterialIcon({ name, filled = false, className = "" }: Props) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
