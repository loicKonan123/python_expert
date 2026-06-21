"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
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

  useImperativeHandle(ref, () => ({
    focus: () => {
      taRef.current?.focus();
    },
  }));

  // Auto-resize en fonction du contenu.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSubmit();
    }
  }

  return (
    <div
      className={`fixed bottom-0 right-0 p-gutter flex justify-center pointer-events-none z-20 transition-[left] duration-200 ${
        sidebarOpen ? "left-sidebar-width" : "left-0"
      }`}
    >
      <div className="w-full max-w-chat-max-width glass-card-strong p-4 rounded-2xl pointer-events-auto space-y-3">
        {/* Filtre par corpus */}
        <CorpusFilter selected={selectedCorpora} onChange={onCorporaChange} />

        {/* Zone de saisie */}
        <div className="relative flex items-end gap-3">
          <div className="flex-1 bg-surface-container-lowest/60 rounded-xl px-4 py-3 min-h-14 flex flex-col justify-center border border-outline-variant/40 focus-within:border-primary/60 focus-within:bg-surface-container-lowest/80 transition-colors">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pose ta question... (Ctrl+K pour focus)"
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[16px] leading-[1.6] p-0 resize-none custom-scrollbar max-h-40 placeholder:text-on-surface-variant/60"
              disabled={busy}
            />
          </div>

          <div className="flex gap-2 mb-1">
            {busy && onCancel ? (
              <button
                onClick={onCancel}
                className="p-3 bg-error/20 text-error rounded-xl hover:bg-error/30 transition-colors"
                title="Annuler"
              >
                <MaterialIcon name="stop" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!value.trim() || busy}
                className="p-3 bg-gradient-to-br from-primary to-[#3776ab] text-on-primary rounded-xl hover:brightness-110 transition-all shadow-[0_8px_24px_rgba(152,203,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                title="Envoyer (Entrée)"
              >
                <MaterialIcon name="send" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
