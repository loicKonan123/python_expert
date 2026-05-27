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
};

export type AskEvents = {
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
 * Lance une requête /ask et streame les événements SSE au fur et à mesure.
 * Renvoie une fonction d'annulation.
 */
export function askStream(question: string, events: AskEvents): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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

          if (evt.event === "sources") {
            try {
              events.onSources(JSON.parse(evt.data));
            } catch {
              /* ignore parse errors */
            }
          } else if (evt.event === "token") {
            // Le backend échappe les \n en "\\n" car SSE utilise \n comme séparateur.
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
