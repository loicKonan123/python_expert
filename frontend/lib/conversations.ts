/**
 * Gestion des conversations persistées dans localStorage.
 *
 * Chaque conversation = un fil indépendant avec ses propres messages.
 * On migre depuis l'ancien format mono-conversation au premier chargement.
 */
import type { Message } from "@/components/ChatMessage";
import type { Corpus } from "@/lib/curriculum";


export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  /** Filtre par corpus mémorisé pour cette conversation. */
  corpora: Corpus[];
};


const CONVERSATIONS_KEY = "pyexpert.conversations";
const CURRENT_KEY = "pyexpert.currentConversationId";
// Anciennes clés à migrer (un seul fil) — supprimées après migration.
const LEGACY_MESSAGES_KEY = "pyexpert.messages";
const LEGACY_CORPORA_KEY = "pyexpert.corpora";


/** Crée une nouvelle conversation vide. */
export function newConversation(initialCorpora: Corpus[] = []): Conversation {
  const now = Date.now();
  return {
    id: `c-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Nouvelle conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
    corpora: initialCorpora,
  };
}


/** Génère un titre lisible à partir des premiers messages. */
export function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Nouvelle conversation";
  const trimmed = firstUser.content.trim().replace(/\s+/g, " ");
  return trimmed.length <= 60 ? trimmed : trimmed.slice(0, 57) + "…";
}


/** Charge toutes les conversations depuis localStorage. */
export function loadAllConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return migrateLegacyConversation();
    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed)) return [];
    // Sécurité : neutralise tout flag streaming résiduel.
    return parsed.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({ ...m, streaming: false })),
    }));
  } catch {
    return [];
  }
}


/** Migre l'ancien format mono-conversation vers le nouveau format multi. */
function migrateLegacyConversation(): Conversation[] {
  try {
    const oldMsgs = localStorage.getItem(LEGACY_MESSAGES_KEY);
    if (!oldMsgs) return [];
    const parsed = JSON.parse(oldMsgs) as Message[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    const corporaRaw = localStorage.getItem(LEGACY_CORPORA_KEY);
    const corpora: Corpus[] = corporaRaw ? JSON.parse(corporaRaw) : [];

    const conv: Conversation = {
      ...newConversation(corpora),
      messages: parsed.map((m) => ({ ...m, streaming: false })),
    };
    conv.title = generateTitle(conv.messages);

    // Nettoie les anciennes clés après migration réussie.
    localStorage.removeItem(LEGACY_MESSAGES_KEY);
    return [conv];
  } catch {
    return [];
  }
}


/** Persiste toutes les conversations. */
export function saveAllConversations(convs: Conversation[]): void {
  // Neutralise les flags streaming AVANT persistance pour éviter les états
  // bizarres en cas de F5 pendant une réponse.
  const stable = convs.map((c) => ({
    ...c,
    messages: c.messages.map((m) => ({ ...m, streaming: false })),
  }));
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(stable));
}


export function loadCurrentId(): string | null {
  return localStorage.getItem(CURRENT_KEY);
}

export function saveCurrentId(id: string | null): void {
  if (id === null) localStorage.removeItem(CURRENT_KEY);
  else localStorage.setItem(CURRENT_KEY, id);
}


/** Trie les conversations par date de mise à jour, plus récentes en premier. */
export function sortByUpdated(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => b.updatedAt - a.updatedAt);
}


/**
 * Convertit une conversation en Markdown pour export.
 * Préserve les blocs de code et les sources.
 */
export function conversationToMarkdown(conv: Conversation): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title}`);
  lines.push("");
  lines.push(
    `*Créé le ${new Date(conv.createdAt).toLocaleString("fr-FR")} — ` +
      `${conv.messages.length} messages*`,
  );
  if (conv.corpora.length > 0) {
    lines.push(`*Corpus : ${conv.corpora.join(", ")}*`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const m of conv.messages) {
    if (m.role === "user") {
      lines.push(`### 🧑 Question`);
      lines.push("");
      lines.push(m.content);
      lines.push("");
    } else {
      lines.push(`### 🤖 Tuteur`);
      lines.push("");
      if (m.rewrittenQuery) {
        lines.push(`> *Recherché : ${m.rewrittenQuery}*`);
        lines.push("");
      }
      lines.push(m.content);
      lines.push("");
      if (m.sources && m.sources.length) {
        lines.push("**Sources documentaires :**");
        lines.push("");
        m.sources.forEach((s, i) => {
          lines.push(
            `- \`[${i + 1}]\` **${s.corpus}** / ${s.source} §${s.section} ` +
              `(score ${s.score.toFixed(2)})`,
          );
        });
        lines.push("");
      }
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}


/** Déclenche le téléchargement d'un fichier .md dans le navigateur. */
export function downloadAsMarkdown(conv: Conversation): void {
  const md = conversationToMarkdown(conv);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeTitle = conv.title
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 50);
  const filename = `${safeTitle}_${conv.id.slice(-6)}.md`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
