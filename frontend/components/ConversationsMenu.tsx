"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { downloadAsMarkdown, sortByUpdated, type Conversation } from "@/lib/conversations";


type Props = {
  conversations: Conversation[];
  currentId: string | null;
  onPick: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

/**
 * Popover déclenché depuis le TopBar. Affiche la liste de toutes les
 * conversations sauvegardées avec actions (ouvrir, supprimer, export).
 */
export function ConversationsMenu({
  conversations,
  currentId,
  onPick,
  onNew,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Ferme au click extérieur ou Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sorted = sortByUpdated(conversations);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-full transition-colors ${
          open
            ? "bg-surface-container-high text-on-surface"
            : "hover:bg-surface-container-high text-on-surface-variant"
        }`}
        title={`Conversations (${conversations.length})`}
      >
        <MaterialIcon name="history" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[360px] max-h-[70vh] overflow-hidden flex flex-col rounded-xl border border-outline-variant bg-surface-container shadow-2xl"
          role="menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <div className="text-[13px] font-mono uppercase tracking-widest text-on-surface-variant">
              Conversations · {conversations.length}
            </div>
            <button
              onClick={() => {
                onNew();
                setOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-on-primary text-[12px] hover:opacity-90 transition-opacity"
            >
              <MaterialIcon name="add" className="text-[14px]" />
              Nouvelle
            </button>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px] text-on-surface-variant">
                Aucune conversation. Pose une question pour en démarrer une.
              </div>
            )}

            {sorted.map((c) => {
              const isCurrent = c.id === currentId;
              return (
                <div
                  key={c.id}
                  className={`group flex items-stretch border-b border-outline-variant/40 last:border-b-0 ${
                    isCurrent
                      ? "bg-primary-container/15 border-l-2 border-l-primary"
                      : "hover:bg-surface-container-high"
                  }`}
                >
                  <button
                    onClick={() => {
                      onPick(c.id);
                      setOpen(false);
                    }}
                    className="flex-1 text-left px-4 py-3 min-w-0"
                  >
                    <div className="text-[13px] text-on-surface truncate font-medium">
                      {c.title}
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>{c.messages.length} messages</span>
                      <span>·</span>
                      <span>{formatRelative(c.updatedAt)}</span>
                    </div>
                  </button>

                  {/* Actions par item */}
                  <div className="flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAsMarkdown(c);
                      }}
                      className="p-1.5 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                      title="Exporter en Markdown"
                    >
                      <MaterialIcon name="download" className="text-[16px]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(`Supprimer « ${truncate(c.title, 40)} » ?`)
                        ) {
                          onDelete(c.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-error/20 text-on-surface-variant hover:text-error"
                      title="Supprimer"
                    >
                      <MaterialIcon name="delete" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/** Format relatif simple : "il y a 5 min", "hier", "12 mai". */
function formatRelative(ts: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - ts) / 1000);
  if (diffSec < 60) return "à l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 86400 * 7) return `il y a ${Math.floor(diffSec / 86400)} j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}


function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
