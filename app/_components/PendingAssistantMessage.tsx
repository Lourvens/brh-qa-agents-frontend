"use client";

import { useEffect, useState } from "react";

import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { useReadyzProbe } from "@/hooks/useReadyzProbe";

import { AgentStatus } from "./AgentStatus";
import { effectiveAgentPhase } from "../_lib/message-parts";

/**
 * Placeholder assistant row shown during the TTFT window
 * (`status === "submitted"`, no SSE frames yet, no assistant message
 * in `messages` yet). Reuses the same elapsed-time + readyz-aware
 * `effectiveAgentPhase` escalation that `AssistantParts` uses, so the
 * cold-start / connecting / patient-waiting copy (UIUX §7 §9) appears
 * immediately — even on the Render free-tier's 30-60 s cold-start,
 * where nothing else would otherwise be visible.
 *
 * Disappears as soon as `useChat` appends the real assistant message
 * (status transitions to `"streaming"`); the parent page renders this
 * only while `status === "submitted"`.
 */
export function PendingAssistantMessage() {
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, []);

  const readyz = useReadyzProbe(true);
  const phase = effectiveAgentPhase([], true, elapsedMs, readyz);

  return (
    <Message from="assistant">
      <MessageContent>
        <AgentStatus phase={phase} />
      </MessageContent>
    </Message>
  );
}