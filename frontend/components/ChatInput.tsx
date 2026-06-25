"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MaterialIcon } from "./MaterialIcon";
import { CorpusFilter } from "./CorpusFilter";
import type { Corpus } from "@/lib/curriculum";

export type ChatInputHandle = {
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  busy?: boolean;
  sidebarOpen: boolean;
  selectedCorpora: Corpus[];
  onCorporaChange: (next: Corpus[]) => void;
  /** Phase 9 — intent actuel (None = pas d'orientation, comportement défaut). */
  intent: Intent | null;
  onIntentChange: (next: Intent | null) => void;
};

/**
 * Phase 9 — 6 intents câblés.
 *
 * L'intent est passé en paramètre à /api/ask qui injecte un complément au
 * system prompt (voir backend/prompts.py:INTENT_PROMPTS) ET boost certains
 * corpus dans le retrieval (INTENT_CORPUS_BOOST).
 *
 * On passe de l'ancien comportement "prefix texte dans l'input" à un vrai
 * state qui voyage avec la requête. Persistance dans localStorage.
 */
export type Intent =
  | "generate"
  | "explain"
  | "refactor"
  | "debug"
  | "test"
  | "optimize";

const INTENTS: Array<{ id: Intent; label: string; icon: string; hint: string }> = [
  { id: "generate", label: "Generate", icon: "auto_awesome",   hint: "Partir de zéro — code runnable complet" },
  { id: "explain",  label: "Explain",  icon: "school",          hint: "Comprendre un concept ou un code" },
  { id: "refactor", label: "Refactor", icon: "auto_fix_high",   hint: "Améliorer la structure (avant / après)" },
  { id: "debug",    label: "Debug",    icon: "bug_report",      hint: "Trouver et fixer un bug + test de non-régression" },
  { id: "test",     label: "Test",     icon: "science",         hint: "Écrire des tests (golden + edges + erreurs)" },
  { id: "optimize", label: "Optimize", icon: "speed",           hint: "Améliorer les performances (mesure avant/après)" },
];

/**
 * ChatInput — barre flottante compacte en bas de l'app.
 *
 * Layout : Sources [pill compact] · Intent [pill compact] · textarea · Send.
 * Tout tient sur 1 ligne. Les filtres Sources et le sélecteur Intent vivent
 * dans des popovers qui s'ouvrent au-dessus de la barre. Plus de bandeaux
 * inline qui prennent 100px de haut chacun.
 */
export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  {
    value,
    onChange,
    onSubmit,
    onCancel,
    busy,
    sidebarOpen,
    selectedCorpora,
    onCorporaChange,
    intent,
    onIntentChange,
  },
  ref,
) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  const sourcesRef = useRef<HTMLDivElement | null>(null);
  const intentRef  = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      taRef.current?.focus();
    },
  }));

  // Auto-resize en fonction du contenu (max 200px).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  // Fermer les popovers au click extérieur / Escape.
  useEffect(() => {
    if (!sourcesOpen && !intentOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sourcesOpen && sourcesRef.current && !sourcesRef.current.contains(t)) {
        setSourcesOpen(false);
      }
      if (intentOpen && intentRef.current && !intentRef.current.contains(t)) {
        setIntentOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSourcesOpen(false);
        setIntentOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [sourcesOpen, intentOpen]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSubmit();
    }
  }

  function pickIntent(next: Intent | null) {
    onIntentChange(next);
    setIntentOpen(false);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  const sourcesLabel =
    selectedCorpora.length === 0 ? "Toutes" : `${selectedCorpora.length}`;
  const currentIntentLabel = intent
    ? INTENTS.find((it) => it.id === intent)?.label ?? "—"
    : "—";

  return (
    <div
      className={`fixed bottom-0 right-0 p-4 flex justify-center pointer-events-none z-20 transition-[left] duration-200 ${
        sidebarOpen ? "left-sidebar-width" : "left-0"
      }`}
    >
      <div className="w-full max-w-chat-max-width glass-card-strong p-2 rounded-2xl pointer-events-auto">
        <div className="relative flex items-center gap-2">
          {/* Popover Sources */}
          <div ref={sourcesRef} className="relative">
            <CompactPill
              icon="filter_alt"
              label="Sources"
              value={sourcesLabel}
              active={sourcesOpen}
              onClick={() => {
                setSourcesOpen((v) => !v);
                setIntentOpen(false);
              }}
            />
            {sourcesOpen && (
              <Popover>
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70 mb-2">
                  Limiter aux corpus
                </div>
                <CorpusFilter
                  selected={selectedCorpora}
                  onChange={onCorporaChange}
                />
              </Popover>
            )}
          </div>

          {/* Popover Intent */}
          <div ref={intentRef} className="relative">
            <CompactPill
              icon="psychology"
              label="Intent"
              value={currentIntentLabel}
              active={intentOpen || intent !== null}
              onClick={() => {
                setIntentOpen((v) => !v);
                setSourcesOpen(false);
              }}
            />
            {intentOpen && (
              <Popover>
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70 mb-2">
                  Oriente le format de la réponse (Phase 9)
                </div>
                <div className="flex flex-col gap-1">
                  {/* Option "aucun" pour revenir au comportement par défaut */}
                  <button
                    onClick={() => pickIntent(null)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left transition-colors ${
                      intent === null
                        ? "bg-accent/15 text-accent"
                        : "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface"
                    }`}
                  >
                    <MaterialIcon name="block" className="text-[16px]" />
                    <span>Aucun intent</span>
                    <span className="text-[10px] text-on-surface-variant/60 ml-auto">défaut</span>
                  </button>
                  <div className="h-px bg-on-surface/10 my-1" />
                  {INTENTS.map((it) => {
                    const active = intent === it.id;
                    return (
                      <button
                        key={it.id}
                        onClick={() => pickIntent(it.id)}
                        className={`flex items-start gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left transition-colors ${
                          active
                            ? "bg-accent/15 text-accent"
                            : "text-on-surface hover:bg-on-surface/5"
                        }`}
                      >
                        <MaterialIcon
                          name={it.icon}
                          className={`text-[16px] mt-0.5 ${active ? "text-accent" : "text-action"}`}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium">{it.label}</span>
                          <span className="block text-[11px] text-on-surface-variant/70 leading-snug">
                            {it.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Popover>
            )}
          </div>

          {/* Textarea */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pose ta question… (Ctrl+K)"
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] leading-[1.5] px-2 py-2 resize-none custom-scrollbar max-h-40 placeholder:text-on-surface-variant/60"
              disabled={busy}
            />
          </div>

          {/* Send / Cancel */}
          {busy && onCancel ? (
            <button
              onClick={onCancel}
              className="p-2.5 bg-error/20 text-error rounded-xl hover:bg-error/30 transition-colors shrink-0"
              title="Annuler"
            >
              <MaterialIcon name="stop" />
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={!value.trim() || busy}
              className="p-2.5 bg-action text-white rounded-xl hover:brightness-110 transition-all shadow-[0_4px_16px_-4px_rgba(99,102,241,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
              title="Envoyer (Entrée)"
            >
              <MaterialIcon name="send" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/** Pill compact avec icône, label monospace, et valeur courante. */
function CompactPill({
  icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-mono transition-colors shrink-0 ${
        active
          ? "bg-action/15 text-action border border-action/30"
          : "bg-on-surface/5 text-on-surface-variant border border-on-surface/10 hover:text-on-surface hover:border-on-surface/20"
      }`}
      title={`${label} : ${value}`}
    >
      <MaterialIcon name={icon} className="text-[14px]" />
      <span className="uppercase tracking-wider">{label}</span>
      <span
        className={`px-1.5 py-px rounded-md text-[10px] font-semibold ${
          active ? "bg-action/20" : "bg-on-surface/10 text-on-surface"
        }`}
      >
        {value}
      </span>
    </button>
  );
}

/** Wrapper popover qui s'ouvre au-dessus du pill. */
function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 z-30 w-[min(340px,calc(100vw-2rem))] max-h-[60vh] overflow-auto custom-scrollbar p-3 rounded-xl glass-card-strong">
      {children}
    </div>
  );
}

