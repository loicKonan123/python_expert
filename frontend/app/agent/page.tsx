"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  runAgentStream,
  type AgentStep,
  type AgentDone,
} from "@/lib/api";

/** Icône + couleur par tool, pour la timeline. */
const TOOL_META: Record<string, { icon: string; color: string; label: string }> = {
  write_file:   { icon: "edit_document",  color: "#FBBF24", label: "write_file" },
  read_file:    { icon: "description",    color: "#3B82C4", label: "read_file" },
  list_files:   { icon: "folder_open",    color: "#6BC04B", label: "list_files" },
  run_command:  { icon: "terminal",       color: "#06B6D4", label: "run_command" },
  search_docs:  { icon: "menu_book",      color: "#A78BFA", label: "search_docs" },
  finish:       { icon: "check_circle",   color: "#22C55E", label: "finish" },
};

const EXAMPLES = [
  "Écris une fonction Python fibonacci(n) avec mémoïsation + 3 tests pytest, et fais-les passer.",
  "Crée un parseur CSV simple en Python (lit un fichier, retourne une liste de dicts) avec des tests.",
  "Écris une classe Stack en Python (push/pop/peek/is_empty) + tests pytest complets.",
];

export default function AgentPage() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [done, setDone] = useState<AgentDone | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  function launch() {
    const t = task.trim();
    if (!t || running) return;
    setSteps([]);
    setDone(null);
    setError(null);
    setRunning(true);
    cancelRef.current = runAgentStream(t, {
      onStep: (s) => setSteps((prev) => [...prev, s]),
      onDone: (d) => {
        setDone(d);
        setRunning(false);
      },
      onError: (e) => {
        setError(e.message);
        setRunning(false);
      },
    }, 18);
  }

  function stop() {
    cancelRef.current?.();
    setRunning(false);
  }

  return (
    <main className="min-h-screen tech-grid">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 px-gutter bg-background/60 backdrop-blur-xl border-b border-on-surface/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant" title="Retour au chat">
            <MaterialIcon name="arrow_back" />
          </Link>
          <div className="flex items-center gap-2">
            <MaterialIcon name="smart_toy" filled className="text-accent text-[22px]" />
            <h1 className="text-[18px] font-semibold text-on-surface">Mode Agent</h1>
            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 border border-outline-variant/40 rounded px-1.5 py-0.5">
              beta
            </span>
          </div>
        </div>
        <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface">Polaris</Link>
      </header>

      <div className="max-w-3xl mx-auto px-gutter py-8 space-y-6">
        {/* Intro */}
        <div>
          <h2 className="text-[22px] font-semibold text-on-surface">
            Donne une tâche, l&apos;agent code et vérifie tout seul.
          </h2>
          <p className="text-[14px] text-on-surface-variant mt-1 leading-[1.55]">
            L&apos;agent écrit des fichiers, exécute des commandes (pytest…),
            lit les erreurs et se corrige en autonomie — spécialisé sur la stack
            indexée. Il consulte la doc officielle avant de coder.
          </p>
        </div>

        {/* Zone de saisie */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Ex : Écris une fonction is_palindrome(s) en Python + tests pytest, et fais-les passer."
            rows={3}
            disabled={running}
            className="w-full bg-transparent resize-none text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-on-surface-variant/60 font-mono">
              exécution locale · sandbox · max 18 étapes
            </span>
            {running ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-error/20 text-error text-[14px] font-medium hover:bg-error/30 transition-colors"
              >
                <MaterialIcon name="stop" className="text-[18px]" />
                Arrêter
              </button>
            ) : (
              <button
                onClick={launch}
                disabled={!task.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-surface text-[14px] font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <MaterialIcon name="play_arrow" className="text-[18px]" />
                Lancer l&apos;agent
              </button>
            )}
          </div>
        </div>

        {/* Exemples (si rien encore) */}
        {steps.length === 0 && !running && (
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60">
              Exemples
            </p>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setTask(ex)}
                className="w-full text-left glass-card rounded-xl px-4 py-3 text-[13px] text-on-surface-variant hover:text-on-surface hover:border-accent/30 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Cheminement de l'agent — timeline connectée */}
        {steps.length > 0 && (
          <div className="relative pl-8">
            {/* Rail vertical qui relie les étapes */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-outline-variant/40 to-transparent" />
            <div className="space-y-3">
              {steps.map((s) => (
                <StepCard key={s.index} step={s} />
              ))}
            </div>
            {running && (
              <div className="relative mt-3">
                <span className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full bg-accent/30 border-2 border-accent animate-pulse" />
                <div className="flex items-center gap-2 text-[13px] text-on-surface-variant italic">
                  <span className="agent-thinking-dot" />
                  <span className="agent-thinking-dot" style={{ animationDelay: "150ms" }} />
                  <span className="agent-thinking-dot" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1">L&apos;agent réfléchit…</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="glass-card rounded-xl p-4 border border-error/40 text-[13px] text-error">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Résumé final */}
        {done && (
          <div
            className={`glass-card rounded-2xl p-5 border ${
              done.success ? "border-green-500/40" : "border-error/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MaterialIcon
                name={done.success ? "check_circle" : "error"}
                filled
                className={done.success ? "text-green-500" : "text-error"}
              />
              <span className="font-semibold text-on-surface">
                {done.success ? "Tâche terminée" : "Terminé sans succès"} · {done.state}
              </span>
            </div>
            <p className="text-[14px] text-on-surface-variant leading-[1.55]">{done.summary}</p>
            {done.files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {done.files.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-on-surface/[0.04] border border-on-surface/10 text-[11px] font-mono text-on-surface-variant"
                  >
                    <MaterialIcon name="draft" className="text-[12px]" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StepCard({ step }: { step: AgentStep }) {
  const meta = TOOL_META[step.tool] ?? { icon: "bolt", color: "#9a9cab", label: step.tool };
  const [open, setOpen] = useState(false);
  const argsPreview =
    step.tool === "write_file"
      ? String(step.args.path ?? "")
      : step.tool === "run_command"
        ? String(step.args.command ?? "")
        : step.tool === "read_file"
          ? String(step.args.path ?? "")
          : step.tool === "search_docs"
            ? String(step.args.query ?? "")
            : "";

  return (
    <div className="relative agent-step-in">
      {/* Point sur le rail */}
      <span
        className="absolute -left-[25px] top-3 w-3.5 h-3.5 rounded-full shrink-0"
        style={{ background: meta.color, boxShadow: `0 0 0 3px ${meta.color}22` }}
      />
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Le RAISONNEMENT en tête — c'est le cheminement de l'agent */}
        {step.thought && (
          <div className="flex items-start gap-2 px-4 pt-4">
            <MaterialIcon name="psychology" className="text-accent text-[16px] mt-0.5 shrink-0" />
            <p className="text-[14px] text-on-surface leading-[1.55]">{step.thought}</p>
          </div>
        )}
        {/* L'action décidée */}
        <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono"
            style={{ background: `${meta.color}1f`, border: `1px solid ${meta.color}44`, color: meta.color }}
          >
            <MaterialIcon name={meta.icon} filled className="text-[13px]" />
            {meta.label}
          </span>
          {argsPreview && (
            <span className="text-[11px] font-mono text-on-surface-variant/80 truncate max-w-[60%]">
              {argsPreview}
            </span>
          )}
          {step.observation && step.ok && (
            <span className="text-[11px] text-green-500 inline-flex items-center gap-0.5">
              <MaterialIcon name="check" className="text-[13px]" /> ok
            </span>
          )}
          {step.observation && !step.ok && (
            <span className="text-[11px] text-error inline-flex items-center gap-0.5">
              <MaterialIcon name="close" className="text-[13px]" /> échec
            </span>
          )}
          {step.observation && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="ml-auto text-[11px] font-mono text-on-surface-variant/70 hover:text-on-surface flex items-center gap-1"
            >
              <MaterialIcon name={open ? "expand_less" : "expand_more"} className="text-[14px]" />
              {open ? "masquer" : "sortie"}
            </button>
          )}
        </div>
        {open && step.observation && (
          <pre
            className={`mx-4 mb-4 text-[11.5px] font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto custom-scrollbar rounded-lg p-3 bg-on-surface/[0.03] border border-on-surface/10 ${
              step.ok ? "text-on-surface-variant" : "text-error/90"
            }`}
          >
            {step.observation}
          </pre>
        )}
      </div>
    </div>
  );
}
