import { MaterialIcon } from "./MaterialIcon";

export function WelcomeHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-16">
      <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant">
        <MaterialIcon
          name="smart_toy"
          filled
          className="text-primary text-[36px]"
        />
      </div>
      <div className="max-w-2xl">
        <h2 className="text-[32px] leading-tight font-semibold text-primary-fixed-dim tracking-tight">
          Bonjour, Développeur.
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-3 leading-[1.6]">
          Ton tuteur Python, alimenté par la documentation officielle{" "}
          <strong className="text-on-surface">Python 3.14</strong>.
          Pose une question ou pioche un concept dans le parcours à gauche.
        </p>
      </div>
    </div>
  );
}
