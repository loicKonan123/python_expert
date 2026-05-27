"use client";

import { MaterialIcon } from "./MaterialIcon";
import { CodeBlock } from "./CodeBlock";
import { Sources } from "./Sources";
import { parseMarkdown, renderInlineMarkdown } from "@/lib/markdown";
import type { Source } from "@/lib/api";

export type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  sources?: Source[];
  /** En cours de streaming ? affiche un curseur */
  streaming?: boolean;
};

type Props = { message: Message };

export function ChatMessage({ message }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-5 py-3 rounded-2xl border border-outline-variant bg-surface-container-low">
          <p className="text-[16px] leading-[1.6]">{message.content}</p>
        </div>
      </div>
    );
  }

  const blocks = parseMarkdown(message.content);

  return (
    <div className="flex justify-start gap-4">
      <div className="w-1 self-stretch bg-primary rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant space-y-4">
          {message.content === "" && message.streaming ? (
            <div className="flex items-center gap-2 text-on-surface-variant text-[14px]">
              <MaterialIcon
                name="bolt"
                className="text-secondary text-[18px] animate-pulse"
              />
              Recherche dans la documentation et génération...
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, i) => {
                if (block.kind === "code") {
                  return (
                    <CodeBlock
                      key={i}
                      code={block.code}
                      lang={block.lang}
                    />
                  );
                }
                return (
                  <div
                    key={i}
                    className="md text-[16px] text-on-surface leading-[1.6] whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: renderInlineMarkdown(block.text),
                    }}
                  />
                );
              })}
              {message.streaming && (
                <span className="typing-caret inline-block" aria-hidden="true" />
              )}
            </div>
          )}

          {message.sources && message.sources.length > 0 && (
            <Sources sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  );
}
