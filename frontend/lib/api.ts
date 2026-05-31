/**
 * Client HTTP pour le backend Python RAG.
 * Streame la réponse via Server-Sent Events.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type Source = {
  source: string;   // chemin (ex: "library/dataclasses.txt")
  section: string;  // titre de section (ex: "Module contents")
  text: string;     // contenu du chunk
  score: number;    // similarité (0..1)
  corpus: string;   // nom du corpus ("python", "fastapi", "pydantic", ...)
};

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AskOptions = {
  /** Historique de conversation (sans le system, sans les chunks). */
  history?: HistoryMessage[];
  /** Restreindre à ces corpus. Liste vide / undefined = tous. */
  corpora?: string[];
  /** Demander au LLM de réécrire la question (utile FR / follow-ups). */
  rewriteQuery?: boolean;
};

export type AskEvents = {
  /** Modèle effectivement choisi par l'auto-routing (envoyé si non-défaut). */
  onModel?: (model: string) => void;
  /** Question réécrite par le LLM (envoyée une fois si rewriting actif). */
  onRewrite?: (rewritten: string) => void;
  /** Sources récupérées (envoyées une fois, avant les tokens) */
  onSources: (sources: Source[]) => void;
  /** Chaque token / morceau de texte généré */
  onToken: (text: string) => void;
  /** Génération terminée */
  onDone: () => void;
  /** Erreur réseau ou serveur */
  onError: (err: Error) => void;
};

/**
 * Lance une requête /api/ask et streame les événements SSE au fur et à mesure.
 * Renvoie une fonction d'annulation.
 */
export function askStream(
  question: string,
  events: AskEvents,
  options: AskOptions = {},
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const body = {
        question,
        history: options.history ?? [],
        corpora: options.corpora && options.corpora.length > 0 ? options.corpora : null,
        rewrite_query: options.rewriteQuery ?? true,
      };
      const resp = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        throw new Error(`Serveur a répondu ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const evt = parseSSE(raw);
          if (!evt) continue;

          if (evt.event === "model") {
            events.onModel?.(evt.data);
          } else if (evt.event === "rewrite") {
            events.onRewrite?.(evt.data.replace(/\\n/g, "\n"));
          } else if (evt.event === "sources") {
            try {
              events.onSources(JSON.parse(evt.data));
            } catch {
              /* ignore parse errors */
            }
          } else if (evt.event === "token") {
            events.onToken(evt.data.replace(/\\n/g, "\n"));
          } else if (evt.event === "done") {
            events.onDone();
            return;
          }
        }
      }
      events.onDone();
    } catch (err) {
      if (controller.signal.aborted) return;
      events.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => controller.abort();
}

export type RunResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
  elapsed_ms: number;
  timeout: boolean;
  truncated: boolean;
};

/**
 * Exécute du code Python dans le sandbox backend et retourne le résultat.
 * Aucun streaming — le code tourne, puis on récupère stdout/stderr d'un coup.
 */
export async function runPython(code: string, timeoutS?: number): Promise<RunResult> {
  const resp = await fetch(`${API_BASE}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, timeout_s: timeoutS ?? null }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sandbox HTTP ${resp.status} : ${text.slice(0, 200)}`);
  }
  return resp.json();
}


type SSEEvent = { event: string; data: string };

function parseSSE(raw: string): SSEEvent | null {
  const evt: SSEEvent = { event: "message", data: "" };
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) evt.event = line.slice(7).trim();
    else if (line.startsWith("data: ")) evt.data = line.slice(6);
  }
  if (!evt.data && evt.event === "message") return null;
  return evt;
}
