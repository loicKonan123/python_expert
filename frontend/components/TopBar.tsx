"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { ConversationsMenu } from "./ConversationsMenu";
import type { Conversation } from "@/lib/conversations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type Health = "checking" | "online" | "offline";

type Usage = {
  requests: number;
  total_tokens: number;
  total_cost_usd: number;
};

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  conversations: Conversation[];
  currentId: string | null;
  onNewConversation: () => void;
  onPickConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearConversation?: () => void;
};

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  conversations,
  currentId,
  onNewConversation,
  onPickConversation,
  onDeleteConversation,
  onClearConversation,
}: Props) {
  const [health, setHealth] = useState<Health>("checking");
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    let alive = true;
    const checkHealth = async () => {
      try {
        const r = await fetch(`${API_BASE}/`, { cache: "no-store" });
        if (alive) setHealth(r.ok ? "online" : "offline");
      } catch {
        if (alive) setHealth("offline");
      }
    };
    const checkUsage = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/usage`, { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Usage;
        if (alive) setUsage(data);
      } catch {
        /* on ignore : si l'usage n'est pas accessible, on l'affiche pas */
      }
    };
    checkHealth();
    checkUsage();
    const idH = setInterval(checkHealth, 10_000);
    const idU = setInterval(checkUsage, 5_000);
    return () => {
      alive = false;
      clearInterval(idH);
      clearInterval(idU);
    };
  }, []);

  const statusColor = {
    checking: "bg-on-surface-variant",
    online: "bg-green-500 animate-pulse",
    offline: "bg-error",
  }[health];

  const statusLabel = {
    checking: "Connexion...",
    online: "Backend connecté",
    offline: "Backend hors-ligne",
  }[health];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 px-gutter bg-background/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center transition-[left] duration-200 ${
        sidebarOpen ? "left-sidebar-width" : "left-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title={sidebarOpen ? "Masquer le parcours (Ctrl+B)" : "Afficher le parcours (Ctrl+B)"}
          aria-label={sidebarOpen ? "Masquer la sidebar" : "Afficher la sidebar"}
        >
          <MaterialIcon
            name={sidebarOpen ? "menu_open" : "menu"}
            className="text-[22px]"
          />
        </button>
        <h1 className="text-[20px] font-semibold text-primary-fixed-dim">Python Expert</h1>
        <div className="h-4 w-px bg-outline-variant" />
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-[11px] font-mono tracking-widest uppercase">
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {usage && usage.requests > 0 && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface-variant"
            title={`${usage.requests} requêtes · ${usage.total_tokens.toLocaleString("fr")} tokens · session backend en cours`}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-mono">
              <MaterialIcon name="paid" className="text-secondary text-[14px]" />
              <span className="tabular-nums">${usage.total_cost_usd.toFixed(4)}</span>
            </span>
            <span className="h-3 w-px bg-outline-variant/60" />
            <span className="flex items-center gap-1.5 text-[12px] font-mono">
              <MaterialIcon name="token" className="text-primary text-[14px]" />
              <span className="tabular-nums">{formatTokens(usage.total_tokens)}</span>
            </span>
          </div>
        )}
        <button
          onClick={onNewConversation}
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="Nouvelle conversation (Ctrl+Shift+N)"
        >
          <MaterialIcon name="add_comment" />
        </button>

        <ConversationsMenu
          conversations={conversations}
          currentId={currentId}
          onPick={onPickConversation}
          onNew={onNewConversation}
          onDelete={onDeleteConversation}
        />

        {onClearConversation && (
          <button
            onClick={() => {
              if (confirm("Vider la conversation actuelle (les messages) ?")) {
                onClearConversation();
              }
            }}
            className="p-2 rounded-full hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
            title="Vider la conversation actuelle"
          >
            <MaterialIcon name="delete_sweep" />
          </button>
        )}
        <a
          href="https://github.com/loicKonan123/python_expert"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="Voir sur GitHub"
        >
          <MaterialIcon name="code" />
        </a>
      </div>
    </header>
  );
}

/** Formate un nombre de tokens en notation compacte (1234 -> 1.2k). */
function formatTokens(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
