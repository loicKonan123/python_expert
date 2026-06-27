import { PolarisLogo } from "./PolarisLogo";

type Props = {
  /** Conservé pour compat avec l'appelant — non utilisé dans la version sobre. */
  onPickSuggestion?: (text: string) => void;
};

/**
 * Écran d'accueil de l'app — version sobre et professionnelle.
 * Logo + une phrase. Pas de badges décoratifs, pas de suggestions.
 */
export function WelcomeHero(_: Props) {
  return (
    <div className="py-16 flex flex-col items-center text-center">
      <PolarisLogo size={56} variant="animated" twinkle uid="welcome" />
      <h2 className="mt-6 text-[24px] leading-tight font-semibold text-on-surface">
        Comment puis-je t&apos;aider ?
      </h2>
      <p className="mt-2 text-[14px] text-on-surface-variant max-w-md leading-[1.55]">
        Pose ta question full-stack — chaque réponse cite la doc officielle et
        le code peut être exécuté pour vérification.
      </p>
    </div>
  );
}
