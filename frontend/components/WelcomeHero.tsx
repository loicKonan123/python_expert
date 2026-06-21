import { PolarisLogo } from "./PolarisLogo";

export function WelcomeHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-16">
      <div className="w-20 h-20 rounded-2xl glass-card-strong flex items-center justify-center">
        <PolarisLogo
          size={44}
          primary="var(--color-primary-fixed-dim)"
          twinkle
        />
      </div>
      <div className="max-w-2xl">
        <h2 className="text-[32px] leading-tight font-semibold text-primary-fixed-dim tracking-tight">
          Bonjour, Développeur.<br/>
          <span className="text-[20px] font-mono tracking-widest text-on-surface-variant/70 uppercase">Bienvenue sur Polaris</span>
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-3 leading-[1.6]">
          Ton tuteur full-stack qui ne ment pas. Chaque réponse est citée dans la doc officielle de
          <strong className="text-on-surface"> Python, FastAPI, Pydantic, Next.js, TypeScript</strong> et
          <strong className="text-on-surface"> Tailwind</strong>.
          Pose une question ou pioche un concept dans le parcours à gauche.
        </p>
      </div>
    </div>
  );
}
