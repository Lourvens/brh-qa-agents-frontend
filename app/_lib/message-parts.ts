import type { UIMessage } from "ai";

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
  | "writing";

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
