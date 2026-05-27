import { MaterialIcon } from "./MaterialIcon";

export function WelcomeHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-4 py-12">
      <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant">
        <MaterialIcon
          name="smart_toy"
          filled
          className="text-primary text-[36px]"
        />
      </div>
      <div className="max-w-xl">
        <h2 className="text-[32px] leading-tight font-semibold text-primary-fixed-dim tracking-tight">
          Bonjour, Développeur.
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-3 leading-[1.6]">
          Je suis ton tuteur Python, alimenté par la documentation officielle
          <strong className="text-on-surface"> Python 3.14</strong>.
          Demande-moi des explications sur la syntaxe, la concurrence, l&apos;OO
          avancée, ou pioche un concept dans le parcours à gauche.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 w-full max-w-2xl">
        <FeatureCard
          icon="bolt"
          title="Streaming temps réel"
          desc="Les réponses arrivent au fil de la génération."
        />
        <FeatureCard
          icon="menu_book"
          title="Sources citées"
          desc="Chaque réponse pointe les passages utilisés."
        />
        <FeatureCard
          icon="dns"
          title="100% local"
          desc="Aucune API externe, vie privée totale."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-left">
      <MaterialIcon
        name={icon}
        className="text-primary text-[20px] mb-2"
        filled
      />
      <div className="text-[14px] font-medium text-on-surface mb-1">
        {title}
      </div>
      <div className="text-[12px] text-on-surface-variant leading-[1.5]">
        {desc}
      </div>
    </div>
  );
}
