"use client";

import { useEffect, useRef } from "react";
import { MaterialIcon } from "./MaterialIcon";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  busy?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize en fonction du contenu.
  useEffect(() => {
    const ta = ref.current;
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
    <div className="fixed bottom-0 right-0 left-sidebar-width p-gutter flex justify-center pointer-events-none z-20">
      <div className="w-full max-w-chat-max-width glass-input p-4 rounded-2xl border border-outline-variant shadow-2xl pointer-events-auto">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 bg-surface-container-highest rounded-xl px-4 py-3 min-h-[56px] flex flex-col justify-center border border-transparent focus-within:border-primary transition-colors">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pose une question Python en anglais — ex: How do decorators work?"
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
                className="p-3 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                title="Envoyer"
              >
                <MaterialIcon name="send" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex justify-center">
          <p className="text-[10px] font-mono text-on-surface-variant opacity-50 uppercase tracking-widest">
            Python 3.14 · RAG local · Ollama qwen2.5-coder
          </p>
        </div>
      </div>
    </div>
  );
}
