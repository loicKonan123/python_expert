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
};

type Intent = "Refactor" | "Debug" | "Generate" | "Explain";

const INTENTS: Array<{ label: Intent; icon: string }> = [
  { label: "Refactor", icon: "auto_fix_high" },
  { label: "Debug",    icon: "bug_report" },
  { label: "Generate", icon: "auto_awesome" },
  { label: "Explain",  icon: "school" },
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

  function pickIntent(intent: Intent) {
    onChange(prefixIntent(intent, value));
    setIntentOpen(false);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  const sourcesLabel =
    selectedCorpora.length === 0 ? "Toutes" : `${selectedCorpora.length}`;
  const detectedIntent = detectIntent(value);

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
              value={detectedIntent ?? "—"}
              active={intentOpen}
              onClick={() => {
                setIntentOpen((v) => !v);
                setSourcesOpen(false);
              }}
            />
            {intentOpen && (
              <Popover>
                <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70 mb-2">
                  Préfixer l'intention
                </div>
                <div className="flex flex-col gap-1">
                  {INTENTS.map((it) => (
                    <button
                      key={it.label}
                      onClick={() => pickIntent(it.label)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left text-on-surface hover:bg-on-surface/5 transition-colors"
                    >
                      <MaterialIcon name={it.icon} className="text-[16px] text-action" />
                      {it.label}
                    </button>
                  ))}
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
    <div className="absolute bottom-full mb-2 left-0 z-30 w-[340px] max-h-[60vh] overflow-auto custom-scrollbar p-3 rounded-xl glass-card-strong">
      {children}
    </div>
  );
}

/** Préfixe l'input avec une intention si pas déjà présente. */
function prefixIntent(intent: Intent, current: string): string {
  const trimmed = current.trimStart();
  const prefix = `${intent}: `;
  if (trimmed.toLowerCase().startsWith(intent.toLowerCase() + ":")) return current;
  return prefix + trimmed;
}

/** Détecte un préfixe d'intent au début de l'input pour afficher la valeur du pill. */
function detectIntent(text: string): Intent | null {
  const t = text.trimStart().toLowerCase();
  for (const it of INTENTS) {
    if (t.startsWith(it.label.toLowerCase() + ":")) return it.label;
  }
  return null;
}
