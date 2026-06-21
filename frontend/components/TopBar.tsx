"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { ConversationsMenu } from "./ConversationsMenu";
import { PolarisLogo } from "./PolarisLogo";
import { ThemeToggle } from "./ThemeToggle";
import type { Conversation } from "@/lib/conversations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type Health = "checking" | "online" | "offline";

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
    checkHealth();
    const id = setInterval(checkHealth, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
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
      className={`fixed top-0 right-0 z-30 h-16 px-gutter bg-background/40 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/10 flex justify-between items-center transition-[left] duration-200 ${
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
        <div className="flex items-center gap-2">
          <PolarisLogo
            size={24}
            primary="var(--color-primary-fixed-dim)"
            twinkle
            className="text-primary-fixed-dim"
          />
          <h1 className="text-[20px] font-semibold text-primary-fixed-dim tracking-tight">
            Polaris
          </h1>
        </div>
        <span
          className={`w-2 h-2 rounded-full ${statusColor}`}
          title={statusLabel}
          aria-label={statusLabel}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Compteur tokens/coût retiré de l'UI (Phase 8 — design moins encombré).
            Les données restent disponibles via GET /api/usage si on veut les
            réafficher plus tard (ex: dans un panneau Réglages). */}
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

        <ThemeToggle />

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

