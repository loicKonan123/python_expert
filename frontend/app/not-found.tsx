import Link from "next/link";
import { PolarisLogo } from "@/components/PolarisLogo";
import { Constellation } from "@/components/Constellation";
import { MaterialIcon } from "@/components/MaterialIcon";

export const metadata = {
  title: "Polaris — Page introuvable",
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center tech-grid px-gutter">
      <Constellation
        className="absolute inset-0 -z-10 pointer-events-none"
        density={3}
        uid="404"
      />

      <Link
        href="/"
        aria-label="Retour à l'accueil Polaris"
        className="relative mb-8 transition-transform hover:scale-105"
      >
        <PolarisLogo size={140} variant="animated" uid="404-mark" twinkle />
      </Link>

      <p className="text-[11px] font-mono uppercase tracking-widest text-accent mb-3">
        Polaris · signal perdu
      </p>
      <h1 className="text-[clamp(48px,8vw,96px)] font-extrabold tracking-tight leading-none text-accent mb-4">
        404
      </h1>
      <p className="text-on-surface-variant max-w-md text-center mb-8 leading-[1.6]">
        Cette page n'est dans aucun de nos 13 corpus. Soit elle n'existe pas,
        soit elle a été déplacée pendant qu'on n'écoutait pas la doc.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-action text-white text-[14px] font-semibold shadow-[0_10px_40px_-10px_rgba(99,102,241,0.6)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
        >
          <MaterialIcon name="home" />
          Retour à la landing
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-on-surface/5 border border-on-surface/10 text-[14px] text-on-surface hover:bg-on-surface/10 hover:border-accent/30 transition-colors"
        >
          <MaterialIcon name="chat" />
          Ouvrir le chat
        </Link>
      </div>
    </main>
  );
}
