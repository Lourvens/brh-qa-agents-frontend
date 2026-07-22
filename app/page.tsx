"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";

import { AssistantParts } from "./_components/AssistantParts";
import { EmptyConversation } from "./_components/EmptyConversation";
import { ErrorBanner } from "./_components/ErrorBanner";
import { Header } from "./_components/Header";
import { PromptDock } from "./_components/PromptDock";
import { RateLimitModal } from "./_components/RateLimitModal";
import { ThreadLimitBanner } from "./_components/ThreadLimitBanner";
import { parseRateLimit, type RateLimitInfo } from "./_lib/rate-limit";
import { textParts } from "./_lib/message-parts";
import { SUGGESTIONS } from "./_lib/prompts";
import { MAX_MESSAGES_PER_THREAD } from "./_lib/thread-config";

const TAG = "[brh.chat.page]";

const FR_STATUS_HINT = {
  submitted: "L'agent réfléchit…",
  streaming: "Réponse en cours de génération…",
  error: "Une erreur est survenue.",
  received: "Réponse reçue.",
} as const;

export default function ChatPage() {
  const { messages, sendMessage, status, error, stop, regenerate, setMessages } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
      onError: (err) => {
        // [brh.chat.page] trace — surface the full error so a 422 from
        // the backend is visible in the browser console verbatim.
        console.warn(`${TAG} useChat.onError`, err, "cause:", err?.cause);
      },
      onFinish: ({ messages }) => {
        // [brh.chat.page] trace — log the final assistant parts so we
        // can correlate wire → rendered UIMessage.parts.
        const last = messages[messages.length - 1];
        const lastParts = (last?.parts ?? []).map((p) => {
          const obj: { type: string; toolCallId?: string; state?: string } = {
            type: p.type,
          };
          const m = p as { toolCallId?: string; state?: string };
          if (m.toolCallId) obj.toolCallId = m.toolCallId;
          if (m.state) obj.state = m.state;
          return obj;
        });
        console.log(`${TAG} useChat.onFinish`, {
          msgCount: messages.length,
          lastRole: last?.role,
          lastParts,
        });
      },
    });

  const isStreaming = status === "submitted" || status === "streaming";
  const atLimit = messages.length >= MAX_MESSAGES_PER_THREAD;

  // Rate-limit detection: when the backend returns 429 from /ask,
  // the AI SDK surfaces a fetch error whose `cause` carries the
  // Response. We extract the typed info; if non-null, the modal
  // stays open until the user clicks "Compris". Stays sticky so a
  // dismissal via Esc / outside-click can't accidentally bypass the
  // rate-limit guardrail.
  const rateLimitInfo: RateLimitInfo | null = useMemo(
    () => (status === "error" ? parseRateLimit(error) : null),
    [status, error]
  );
  const [rateLimitOpen, setRateLimitOpen] = useState(false);
  useEffect(() => {
    if (rateLimitInfo) setRateLimitOpen(true);
  }, [rateLimitInfo]);

  // Esc stops generation — bound at the window level so the focus
  // can be anywhere on the page (per UIUX §7 keyboard shortcuts).
  useEffect(() => {
    if (!isStreaming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isStreaming, stop]);

  // Polite live region — announces only state changes, never per token.
  const statusLabel = useMemo(() => {
    if (status === "submitted") return FR_STATUS_HINT.submitted;
    if (status === "streaming") return FR_STATUS_HINT.streaming;
    if (status === "error") return FR_STATUS_HINT.error;
    if (
      messages.length > 0 &&
      messages.at(-1)?.role === "assistant" &&
      !isStreaming
    ) {
      return FR_STATUS_HINT.received;
    }
    return "";
  }, [status, messages, isStreaming]);

  const handleSubmit = (text: string) => {
    const q = text.trim();
    if (!q || atLimit) return;
    console.log(`${TAG} handleSubmit`, {
      question: q,
      historyTail: messages.slice(-2).map((m) => ({
        id: m.id,
        role: m.role,
        partTypes: m.parts?.map((p) => p.type),
      })),
    });
    sendMessage({ text: q });
  };

  const handleReset = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-svh flex-col bg-background">
      <Header />

      <div aria-live="polite" className="sr-only" role="status">
        {statusLabel}
      </div>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <EmptyConversation
              onPick={handleSubmit}
              suggestionChips={SUGGESTIONS}
            />
          ) : (
            messages.map((message) => {
              const isLastAssistant =
                message.role === "assistant" &&
                message.id === messages[messages.length - 1]?.id;
              const streaming = isLastAssistant && isStreaming;
              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" ? (
                      <AssistantParts
                        parts={message.parts}
                        streaming={streaming}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-base leading-relaxed">
                        {textParts(message.parts)}
                      </p>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && !rateLimitOpen ? (
        <ErrorBanner
          message={error.message ?? "La requête a échoué."}
          onRetry={() => regenerate()}
        />
      ) : null}

      {atLimit ? (
        <ThreadLimitBanner
          messageCount={messages.length}
          onReset={handleReset}
        />
      ) : null}

      <PromptDock
        limitReached={atLimit || rateLimitOpen}
        onStop={() => stop()}
        onSubmit={handleSubmit}
        status={status}
      />

      <RateLimitModal
        info={rateLimitInfo}
        onAcknowledge={() => setRateLimitOpen(false)}
        open={rateLimitOpen}
      />
    </div>
  );
}
