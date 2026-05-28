"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ChatMessage, type Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeHero } from "@/components/WelcomeHero";
import { askStream, type Source } from "@/lib/api";
import type { Concept, Level } from "@/lib/curriculum";

const SIDEBAR_STORAGE_KEY = "pyexpert.sidebarOpen";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeLevelNum, setActiveLevelNum] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const cancelRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Restaure l'état de la sidebar depuis localStorage au mount.
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) setSidebarOpen(saved === "1");
  }, []);

  // Persiste à chaque changement.
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  // Raccourci Ctrl+B (ou Cmd+B sur Mac) pour toggler la sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll au bas à chaque update du dernier message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || busy) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: q,
      };
      const botId = `b-${Date.now() + 1}`;
      const botMsg: Message = {
        id: botId,
        role: "bot",
        content: "",
        streaming: true,
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      setBusy(true);

      let bufferedSources: Source[] = [];

      cancelRef.current = askStream(q, {
        onSources: (sources) => {
          bufferedSources = sources;
          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, sources } : m)),
          );
        },
        onToken: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId ? { ...m, content: m.content + text } : m,
            ),
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, streaming: false, sources: bufferedSources }
                : m,
            ),
          );
          setBusy(false);
          cancelRef.current = null;
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    streaming: false,
                    content:
                      m.content +
                      `\n\n**Erreur** : ${err.message}\n\nLe backend Python tourne-t-il bien sur \`localhost:8000\` ?`,
                  }
                : m,
            ),
          );
          setBusy(false);
          cancelRef.current = null;
        },
      });
    },
    [busy],
  );

  function cancel() {
    cancelRef.current?.();
    cancelRef.current = null;
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming
          ? { ...m, streaming: false, content: m.content + "\n\n_[Annulé]_" }
          : m,
      ),
    );
  }

  function pickConcept(concept: Concept, level: Level) {
    setActiveLevelNum(level.num);
    submit(concept.en);
  }

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        activeLevelNum={activeLevelNum}
        onPickConcept={pickConcept}
      />

      <main
        className={`min-h-screen flex flex-col transition-[margin-left] duration-200 ${
          sidebarOpen ? "ml-sidebar-width" : "ml-0"
        }`}
      >
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <div className="pt-16 pb-40 flex-1 flex flex-col items-center">
          <div className="w-full max-w-chat-max-width px-8 py-stack-lg space-y-10">
            {messages.length === 0 ? (
              <WelcomeHero />
            ) : (
              <div className="space-y-8">
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => submit(input)}
          onCancel={cancel}
          busy={busy}
          sidebarOpen={sidebarOpen}
        />
      </main>
    </>
  );
}
