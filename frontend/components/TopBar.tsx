"use client";

import Link from "next/link";
import { MaterialIcon } from "./MaterialIcon";
import { ConversationsMenu } from "./ConversationsMenu";
import { PolarisLogo } from "./PolarisLogo";
import { ThemeToggle } from "./ThemeToggle";
import type { Conversation } from "@/lib/conversations";

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
        <Link
          href="/"
          aria-label="Retour à l'accueil Polaris"
          className="flex items-center gap-2 group"
        >
          <PolarisLogo
            size={28}
            variant="animated"
            twinkle
            uid="topbar"
          />
          <h1 className="text-[20px] font-semibold tracking-tight bg-gradient-to-br from-[#818cf8] to-accent bg-clip-text text-transparent group-hover:brightness-110 transition-all">
            Polaris
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {/* Compteur tokens/coût retiré de l'UI (Phase 8 — design moins encombré).
            Les données restent disponibles via GET /api/usage si on veut les
            réafficher plus tard (ex: dans un panneau Réglages). */}
        <Link
          href="/agent"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-accent hover:bg-accent/10 transition-colors text-[13px] font-medium"
          title="Mode Agent — l'agent code et vérifie en autonomie"
        >
          <MaterialIcon name="smart_toy" filled className="text-[18px]" />
          <span className="hidden sm:inline">Agent</span>
        </Link>

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
            className="hidden sm:inline-flex p-2 rounded-full hover:bg-error/20 text-on-surface-variant hover:text-error transition-colors"
            title="Vider la conversation actuelle"
          >
            <MaterialIcon name="delete_sweep" />
          </button>
        )}
      </div>
    </header>
  );
}


