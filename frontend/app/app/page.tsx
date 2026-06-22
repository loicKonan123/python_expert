"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { ChatMessage, type Message } from "@/components/ChatMessage";
import { ChatInput, type ChatInputHandle } from "@/components/ChatInput";
import { WelcomeHero } from "@/components/WelcomeHero";
import { askStream, type HistoryMessage, type Source } from "@/lib/api";
import {
  generateTitle,
  loadAllConversations,
  loadCurrentId,
  newConversation,
  saveAllConversations,
  saveCurrentId,
  type Conversation,
} from "@/lib/conversations";
import type { Concept, Corpus, Level } from "@/lib/curriculum";

const SIDEBAR_STORAGE_KEY = "pyexpert.sidebarOpen";
const HISTORY_TURNS = 4;


export default function Home() {
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeLevelNum, setActiveLevelNum] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const cancelRef = useRef<(() => void) | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<ChatInputHandle | null>(null);

  // ===== Bootstrap depuis localStorage au mount =====
  useEffect(() => {
    const sidebar = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (sidebar !== null) setSidebarOpen(sidebar === "1");

    const loaded = loadAllConversations();
    const savedId = loadCurrentId();
    if (loaded.length === 0) {
      const fresh = newConversation();
      setConversations([fresh]);
      setCurrentId(fresh.id);
    } else {
      setConversations(loaded);
      const valid =
        savedId && loaded.some((c) => c.id === savedId)
          ? savedId
          : loaded[0].id;
      setCurrentId(valid);
    }
  }, []);

  // ===== Persistance =====
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    if (conversations.length > 0) saveAllConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveCurrentId(currentId);
  }, [currentId]);

  // ===== Raccourcis clavier =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (key === "n" && e.shiftKey) {
        e.preventDefault();
        createNewConversation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Dérivés =====
  const currentConv = useMemo(
    () => conversations.find((c) => c.id === currentId) ?? null,
    [conversations, currentId],
  );

  const messages = currentConv?.messages ?? [];
  const selectedCorpora = currentConv?.corpora ?? [];

  // ===== Auto-scroll =====
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  // ===== History pour multi-tour =====
  const history: HistoryMessage[] = useMemo(() => {
    const valid = messages
      .filter((m) => !m.streaming && m.content.trim() !== "")
      .map((m): HistoryMessage => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
    return valid.slice(-HISTORY_TURNS * 2);
  }, [messages]);

  // ===== Helpers de mutation des conversations =====
  function updateCurrentConv(updater: (c: Conversation) => Conversation) {
    setConversations((prev) =>
      prev.map((c) => (c.id === currentId ? updater(c) : c)),
    );
  }

  function setCurrentCorpora(corpora: Corpus[]) {
    updateCurrentConv((c) => ({ ...c, corpora, updatedAt: Date.now() }));
  }

  function createNewConversation() {
    cancelRef.current?.();
    cancelRef.current = null;
    setBusy(false);
    const fresh = newConversation(currentConv?.corpora ?? []);
    setConversations((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
    setActiveLevelNum(null);
    setInput("");
  }

  function switchConversation(id: string) {
    cancelRef.current?.();
    cancelRef.current = null;
    setBusy(false);
    setCurrentId(id);
    setInput("");
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (id === currentId) {
        const nextId =
          remaining.length > 0 ? remaining[0].id : null;
        setCurrentId(nextId);
        if (!nextId) {
          // Plus aucune convo : on en recrée une fraîche.
          const fresh = newConversation();
          setCurrentId(fresh.id);
          return [fresh];
        }
      }
      return remaining;
    });
  }

  // ===== Soumission =====
  const submit = useCallback(
    (question: string, historyOverride?: HistoryMessage[]) => {
      const q = question.trim();
      if (!q || busy || !currentId) return;

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

      updateCurrentConv((c) => ({
        ...c,
        messages: [...c.messages, userMsg, botMsg],
        title:
          c.messages.length === 0
            ? generateTitle([userMsg])
            : c.title,
        updatedAt: Date.now(),
      }));
      setInput("");
      setBusy(true);

      let bufferedSources: Source[] = [];
      const corporaForCall = currentConv?.corpora ?? [];

      cancelRef.current = askStream(
        q,
        {
          onModel: (model) => {
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === botId ? { ...m, modelOverride: model } : m,
              ),
            }));
          },
          onRewrite: (rewritten) => {
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === botId ? { ...m, rewrittenQuery: rewritten } : m,
              ),
            }));
          },
          onSources: (sources) => {
            bufferedSources = sources;
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === botId ? { ...m, sources } : m,
              ),
            }));
          },
          onToken: (text) => {
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === botId ? { ...m, content: m.content + text } : m,
              ),
              updatedAt: Date.now(),
            }));
          },
          onDone: () => {
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === botId
                  ? { ...m, streaming: false, sources: bufferedSources }
                  : m,
              ),
              updatedAt: Date.now(),
            }));
            setBusy(false);
            cancelRef.current = null;
          },
          onError: (err) => {
            updateCurrentConv((c) => ({
              ...c,
              messages: c.messages.map((m) =>
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
            }));
            setBusy(false);
            cancelRef.current = null;
          },
        },
        {
          history: historyOverride ?? history,
          corpora: corporaForCall,
          rewriteQuery: true,
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, currentId, history, currentConv?.corpora],
  );

  function cancel() {
    cancelRef.current?.();
    cancelRef.current = null;
    setBusy(false);
    updateCurrentConv((c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.streaming
          ? { ...m, streaming: false, content: m.content + "\n\n_[Annulé]_" }
          : m,
      ),
    }));
  }

  function pickConcept(concept: Concept, level: Level) {
    setActiveLevelNum(level.num);
    submit(concept.en);
  }

  function regenerate(botMessageId: string) {
    if (busy || !currentConv) return;
    const idx = currentConv.messages.findIndex((m) => m.id === botMessageId);
    if (idx <= 0) return;
    const prev = currentConv.messages[idx - 1];
    if (prev.role !== "user") return;

    const truncated = currentConv.messages.slice(0, idx - 1);
    const histBefore: HistoryMessage[] = truncated
      .filter((m) => !m.streaming && m.content.trim() !== "")
      .map((m): HistoryMessage => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }))
      .slice(-HISTORY_TURNS * 2);

    updateCurrentConv((c) => ({ ...c, messages: truncated }));
    setTimeout(() => submit(prev.content, histBefore), 0);
  }

  function clearCurrentConversation() {
    cancelRef.current?.();
    cancelRef.current = null;
    setBusy(false);
    updateCurrentConv((c) => ({
      ...c,
      messages: [],
      title: "Nouvelle conversation",
      updatedAt: Date.now(),
    }));
    setActiveLevelNum(null);
  }

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        activeLevelNum={activeLevelNum}
        onPickConcept={pickConcept}
      />

      <main
        className={`min-h-screen flex flex-col transition-[margin-left] duration-200 tech-grid ${
          sidebarOpen ? "ml-sidebar-width" : "ml-0"
        }`}
      >
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          conversations={conversations}
          currentId={currentId}
          onNewConversation={createNewConversation}
          onPickConversation={switchConversation}
          onDeleteConversation={deleteConversation}
          onClearConversation={
            messages.length > 0 ? clearCurrentConversation : undefined
          }
        />

        <div className="pt-16 pb-28 flex-1 flex flex-col items-center">
          <div className="w-full max-w-chat-max-width px-8 py-stack-lg space-y-10">
            {messages.length === 0 ? (
              <WelcomeHero
                onPickSuggestion={(text) => {
                  setInput(text);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
              />
            ) : (
              <div className="space-y-8">
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    onRegenerate={
                      m.role === "bot" && !m.streaming
                        ? () => regenerate(m.id)
                        : undefined
                    }
                    sessionId={currentId ?? undefined}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={() => submit(input)}
          onCancel={cancel}
          busy={busy}
          sidebarOpen={sidebarOpen}
          selectedCorpora={selectedCorpora}
          onCorporaChange={setCurrentCorpora}
        />
      </main>
    </>
  );
}
