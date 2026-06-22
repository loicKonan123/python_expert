import { PolarisLogo } from "./PolarisLogo";
import { MaterialIcon } from "./MaterialIcon";
import { Tilt3D } from "./Tilt3D";

type Props = {
  /** Reçoit le texte de la suggestion cliquée pour pré-remplir l'input. */
  onPickSuggestion?: (text: string) => void;
};

const SUGGESTIONS = [
  {
    icon: "schema",
    title: "Valider un schema Pydantic",
    subtitle: "async + EmailStr + DB",
    prompt:
      "Donne-moi un BaseModel Pydantic v2 avec un validator async qui vérifie l'unicité d'un email dans la base.",
  },
  {
    icon: "api",
    title: "Endpoint FastAPI streamé",
    subtitle: "SSE + dependency injection",
    prompt:
      "Comment écrire un endpoint FastAPI qui streame une réponse en Server-Sent Events avec une dépendance injectée ?",
  },
  {
    icon: "science",
    title: "Fixtures pytest async",
    subtitle: "setup/teardown + httpx",
    prompt:
      "Montre-moi une fixture pytest async qui setup un client httpx, partage la base de données, et teardown proprement.",
  },
];

/**
 * Hero d'accueil de l'app — style "System Initialization" inspiré du mockup
 * Stitch dashboard. Combine une carte glass avec le logo Polaris animé à
 * gauche, un message contextuel au centre, et un bandeau de statut à droite
 * (accuracy + corpus count) pour donner immédiatement le ton "outil sérieux".
 */
export function WelcomeHero({ onPickSuggestion }: Props) {
  return (
    <div className="py-10 space-y-6">
      <div className="glass-card-strong rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6366f1]/30 to-accent/20 flex items-center justify-center shrink-0">
          <PolarisLogo size={44} variant="animated" twinkle uid="welcome" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-accent">
              System Initialization
            </span>
            <span className="w-1 h-1 rounded-full bg-on-surface-variant/40" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/70">
              13 corpus actifs
            </span>
          </div>
          <h2 className="text-[24px] leading-tight font-semibold text-on-surface">
            Bonjour, prêt à débugger l'univers ?
          </h2>
          <p className="text-[14px] text-on-surface-variant mt-1 leading-[1.5]">
            Pose ta question full-stack — Polaris cite la doc officielle et
            exécute le code pour te prouver qu'il marche.
          </p>
        </div>

        {/* Badges accuracy + corpus */}
        <div className="hidden md:flex flex-col gap-2 shrink-0">
          <StatusBadge
            icon="bolt"
            label="Polaris Engine"
            valueClass="text-accent"
            value="Active"
          />
          <StatusBadge
            icon="verified"
            label="Accuracy"
            valueClass="text-action"
            value="99.8%"
          />
        </div>
      </div>

      {/* Suggestions rapides — entrée en matière */}
      <div className="grid sm:grid-cols-3 gap-3">
        {SUGGESTIONS.map((s) => (
          <Suggestion
            key={s.title}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            onClick={() => onPickSuggestion?.(s.prompt)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: string;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low/60 border border-outline-variant/30">
      <MaterialIcon name={icon} filled className={`text-[14px] ${valueClass}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70">
        {label}
      </span>
      <span className={`text-[12px] font-mono font-semibold ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function Suggestion({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <Tilt3D maxTilt={5}>
      <button
        onClick={onClick}
        className="w-full glass-card text-left p-4 rounded-xl hover:border-accent/30 transition-colors group"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#6366f1]/15 flex items-center justify-center shrink-0 group-hover:bg-[#6366f1]/25 transition-colors">
            <MaterialIcon name={icon} className="text-action text-[18px]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-on-surface truncate">
              {title}
            </div>
            <div className="text-[11px] text-on-surface-variant/70 font-mono truncate">
              {subtitle}
            </div>
          </div>
        </div>
      </button>
    </Tilt3D>
  );
}
