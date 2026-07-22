import type { UIMessage } from "ai";

import type { ReadyzState } from "@/hooks/useReadyzProbe";

/* ---------------------------------------------------------------------------
 * Pure functions for extracting typed content from a `UIMessage.parts`
 * array. No JSX, no hooks — only data shaping, so any future reader/test
 * can reason about these in isolation.
 * ------------------------------------------------------------------------- */

export type SourcePart = {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
};

type ToolState =
  | "partial"
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error"
  | "output-denied";

export type ToolPart = {
  state: ToolState;
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export function reasoningText(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning")
    .map((p) => p.text)
    .join("");
}

export function textParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function sourceParts(parts: UIMessage["parts"]): SourcePart[] {
  return parts.filter((p): p is SourcePart => p.type === "source-document");
}

export function toolParts(parts: UIMessage["parts"]): ToolPart[] {
  return parts
    .filter(
      (p) =>
        p.type === "dynamic-tool" ||
        p.type === "tool-invocation" ||
        p.type.startsWith("tool-")
    )
    .map((p) => {
      const toolPart = p as unknown as {
        toolInvocation?: Partial<ToolPart>;
        toolName?: string;
      } & Partial<ToolPart>;
      const invocation = toolPart.toolInvocation ?? toolPart;
      const toolName =
        invocation.toolName ??
        (p.type.startsWith("tool-") ? p.type.slice("tool-".length) : undefined);
      return {
        state: invocation.state ?? "input-available",
        toolCallId: invocation.toolCallId,
        toolName,
        input: invocation.input,
        output: invocation.output,
        errorText: invocation.errorText,
      };
    });
}

export type AgentPhase =
  | "idle"
  | "thinking"
  | "searching"
  | "reading"
  | "rethinking"
  | "researching"
  | "writing"
  | "connecting"
  | "cold-start"
  | "patient-waiting"
  | "unreachable";

export function agentPhase(
  parts: UIMessage["parts"],
  streaming: boolean
): AgentPhase {
  if (!streaming) return "idle";

  const tools = toolParts(parts);
  const body = textParts(parts);
  const hasActiveTool = tools.some(
    ({ state }) =>
      state === "partial" ||
      state === "input-streaming" ||
      state === "input-available"
  );
  const hasToolOutput = tools.some(
    ({ state }) =>
      state === "output-available" ||
      state === "output-error" ||
      state === "output-denied"
  );

  if (body) return "writing";
  if (hasActiveTool) return tools.length > 1 ? "researching" : "searching";
  if (hasToolOutput) return tools.length > 1 ? "rethinking" : "reading";
  if (tools.length > 0) return "reading";
  return "thinking";
}

/**
 * Wraps `agentPhase` with a time- and readiness-aware escalation layer for
 * the cold-start window. Only overrides when the underlying phase is
 * `"thinking"` (i.e. no SSE parts have arrived yet) — real agent activity
 * always wins so we never talk over a working agent.
 */
export function effectiveAgentPhase(
  parts: UIMessage["parts"],
  streaming: boolean,
  elapsedMs: number,
  readyz: ReadyzState,
): AgentPhase {
  const base = agentPhase(parts, streaming);
  if (base !== "thinking") return base;
  if (!streaming) return "idle";

  if (readyz.status === "unreachable") return "unreachable";

  if (elapsedMs < 5000) return "thinking";
  if (elapsedMs < 15000) {
    return readyz.status === "warming" ? "cold-start" : "connecting";
  }
  if (elapsedMs < 35000) {
    return readyz.status === "ready" ? "connecting" : "patient-waiting";
  }
  return "patient-waiting";
}
