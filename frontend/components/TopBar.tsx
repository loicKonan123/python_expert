"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type Health = "checking" | "online" | "offline";

type Props = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function TopBar({ sidebarOpen, onToggleSidebar }: Props) {
  const [health, setHealth] = useState<Health>("checking");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/`, { cache: "no-store" });
        if (alive) setHealth(r.ok ? "online" : "offline");
      } catch {
        if (alive) setHealth("offline");
      }
    };
    check();
    const id = setInterval(check, 10_000);
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
        <a
          href="https://github.com/loicKonan123/python_expert"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="Voir sur GitHub"
        >
          <MaterialIcon name="code" />
        </a>
        <button
          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="Paramètres (bientôt)"
        >
          <MaterialIcon name="settings" />
        </button>
      </div>
    </header>
  );
}
