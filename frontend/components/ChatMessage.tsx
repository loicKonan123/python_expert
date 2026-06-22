"use client";

import { useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { CodeBlock } from "./CodeBlock";
import { Sources, type SourcesHandle } from "./Sources";
import { PolarisLogo } from "./PolarisLogo";
import { parseMarkdown } from "@/lib/markdown";
import { metaForCorpus } from "@/lib/corpus-meta";
import type { Source } from "@/lib/api";

export type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  sources?: Source[];
  /** En cours de streaming ? affiche un curseur */
  streaming?: boolean;
  /** Question réécrite par le LLM (si rewriting actif). */
  rewrittenQuery?: string;
  /** Modèle choisi par l'auto-routing (si non-défaut). */
  modelOverride?: string;
};

type Props = {
  message: Message;
  /** Appelé quand l'utilisateur clique sur « Régénérer ». */
  onRegenerate?: () => void;
  /**
   * ID de session pour le kernel persistant (typiquement la conversation id).
   * Si fourni, les blocs Python utilisent un kernel partagé entre eux et
   * entre les messages de la conversation.
   */
  sessionId?: string;
};

export function ChatMessage({ message, onRegenerate, sessionId }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="glass-card max-w-[85%] px-5 py-3 rounded-2xl border-l-[3px] border-l-[#6366f1]/60">
          <p className="text-[16px] leading-[1.6]">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-action flex items-center justify-center shrink-0 mt-1 shadow-[0_4px_12px_-4px_rgba(99,102,241,0.6)]">
          <MaterialIcon name="person" className="text-white text-[18px]" />
        </div>
      </div>
    );
  }

  return (
    <BotMessage message={message} onRegenerate={onRegenerate} sessionId={sessionId} />
  );
}

function BotMessage({
  message,
  onRegenerate,
  sessionId,
}: {
  message: Message;
  onRegenerate?: () => void;
  sessionId?: string;
}) {
  const blocks = parseMarkdown(message.content);
  const sourcesRef = useRef<SourcesHandle | null>(null);
  const [copied, setCopied] = useState(false);

  // Liste unique des corpus présents dans les sources
  const usedCorpora = uniqueCorpora(message.sources);

  function jumpToSource(idx: number) {
    sourcesRef.current?.openSource(idx);
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex justify-start gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-action flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(139,92,246,0.6)]">
          <PolarisLogo size={18} variant="mono" color="#ffffff" uid={`msg-${message.id}`} />
        </div>
        <div className="w-px flex-1 mt-2 bg-gradient-to-b from-action/40 via-action/20 to-transparent" />
      </div>
      <div className="flex-1 min-w-0 space-y-4">
        <div className="glass-card-strong p-6 rounded-2xl space-y-4">
          {/* Bandeau meta : modèle choisi par auto-routing + rewrite éventuel */}
          {(message.modelOverride || message.rewrittenQuery) && (
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-on-surface-variant/80">
              {message.modelOverride && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-secondary/40 bg-secondary/10 text-secondary"
                  title="Modèle de raisonnement choisi par l'auto-routing"
                >
                  <MaterialIcon name="psychology" className="text-[12px]" />
                  {message.modelOverride}
                </span>
              )}
              {message.rewrittenQuery && (
                <span
                  className="inline-flex items-center gap-1.5 italic"
                  title="Question réécrite par le LLM pour optimiser la recherche"
                >
                  <MaterialIcon name="auto_fix_high" className="text-[12px] text-secondary" />
                  <span className="opacity-70">Recherché :</span>
                  <span className="text-on-surface-variant not-italic">
                    {message.rewrittenQuery}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Badges des technos utilisées */}
          {usedCorpora.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -mt-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/70">
                puise dans :
              </span>
              {usedCorpora.map((corpus) => {
                const m = metaForCorpus(corpus);
                return (
                  <span
                    key={corpus}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${m.bgColor} ${m.color}`}
                  >
                    <MaterialIcon name={m.icon} className="text-[11px]" />
                    {m.label}
                  </span>
                );
              })}
            </div>
          )}

          {message.content === "" && message.streaming ? (
            <div className="flex items-center gap-3 text-on-surface-variant text-[14px]">
              <span className="inline-flex items-end gap-1 h-4" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-accent polaris-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-action polaris-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-action polaris-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span>Recherche dans la documentation et génération…</span>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                // On accumule le code Python rencontré avant chaque bloc, pour
                // que cliquer Run sur le bloc N exécute tous les blocs Python
                // précédents + le bloc N (comportement notebook).
                const precedingPython: string[] = [];
                return blocks.map((block, i) => {
                  if (block.kind === "code") {
                    const isPython = block.lang.toLowerCase().startsWith("py");
                    const preceding = isPython
                      ? precedingPython.slice()
                      : undefined;
                    if (isPython) precedingPython.push(block.code);
                    return (
                      <CodeBlock
                        key={i}
                        code={block.code}
                        lang={block.lang}
                        precedingCode={preceding}
                        sessionId={sessionId}
                      />
                    );
                  }
                  return (
                    <InlineText
                      key={i}
                      text={block.text}
                      onCitationClick={jumpToSource}
                    />
                  );
                });
              })()}
              {message.streaming && (
                <span className="typing-caret inline-block" aria-hidden="true" />
              )}
            </div>
          )}

          {message.sources && message.sources.length > 0 && (
            <Sources ref={sourcesRef} sources={message.sources} />
          )}

          {/* Actions sur la réponse */}
          {!message.streaming && message.content && (
            <div className="flex items-center gap-1 pt-2 border-t border-outline-variant/40 -mb-2 -mx-1">
              <ActionButton
                icon={copied ? "check" : "content_copy"}
                label={copied ? "Copié" : "Copier"}
                onClick={copyAnswer}
              />
              {onRegenerate && (
                <ActionButton
                  icon="refresh"
                  label="Régénérer"
                  onClick={onRegenerate}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
    >
      <MaterialIcon name={icon} className="text-[14px]" />
      {label}
    </button>
  );
}

/** Bloc de texte markdown avec citations [Source N] cliquables. */
function InlineText({
  text,
  onCitationClick,
}: {
  text: string;
  onCitationClick: (idx: number) => void;
}) {
  // On rend le markdown léger en HTML puis on ré-injecte les citations comme
  // composants React via un split sur la regex.
  const parts = splitWithCitations(text);
  return (
    <div className="md text-[16px] text-on-surface leading-[1.6] whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.kind === "citation") {
          return (
            <CitationLink
              key={i}
              idx={part.idx}
              onClick={() => onCitationClick(part.idx - 1)}
            />
          );
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderInline(part.text) }}
          />
        );
      })}
    </div>
  );
}

function CitationLink({ idx, onClick }: { idx: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-baseline align-baseline mx-0.5 px-1.5 py-0.5 rounded-md bg-primary-container/60 text-on-primary-container text-[12px] font-mono font-medium hover:bg-primary-container hover:scale-105 transition-all"
      title={`Aller à la source ${idx}`}
    >
      [{idx}]
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TextPart =
  | { kind: "text"; text: string }
  | { kind: "citation"; idx: number };

/** Sépare un bloc de texte en {text, citation, text, citation, ...}. */
function splitWithCitations(text: string): TextPart[] {
  // Match [Source 1], [Source 2], etc. (case-insensitive) ainsi que [1], [2].
  const re = /\[(?:source\s*)?(\d{1,2})\]/gi;
  const parts: TextPart[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    if (start > cursor) {
      parts.push({ kind: "text", text: text.slice(cursor, start) });
    }
    const idx = parseInt(m[1], 10);
    if (!Number.isNaN(idx)) {
      parts.push({ kind: "citation", idx });
    }
    cursor = start + m[0].length;
  }
  if (cursor < text.length) {
    parts.push({ kind: "text", text: text.slice(cursor) });
  }
  return parts.length ? parts : [{ kind: "text", text }];
}

/** Rendu inline markdown sans les citations (gérées séparément). */
function renderInline(text: string): string {
  let s = escapeHTML(text);
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>");
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  return s;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]!,
  );
}

/** Récupère la liste unique des corpus présents dans les sources, ordre conservé. */
function uniqueCorpora(sources: Source[] | undefined): string[] {
  if (!sources) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sources) {
    const c = s.corpus || "unknown";
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}
