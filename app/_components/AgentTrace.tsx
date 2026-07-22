import { useEffect, useMemo, useRef } from "react";
import type { UIMessage } from "ai";

import { useSmoothStreamingText } from "@/hooks/useSmoothStreamingText";
import { toolParts } from "../_lib/message-parts";

type AgentTraceProps = {
  parts: UIMessage["parts"];
  streaming: boolean;
};

type RetrievedSource = {
  label?: string;
  snippet?: string;
};

type RetrievalOutput = {
  sourceCount?: number;
  sources?: RetrievedSource[];
};

function retrievalLines(output: unknown): string[] {
  if (!output || typeof output !== "object") return [];

  const result = output as RetrievalOutput;
  const sources = Array.isArray(result.sources) ? result.sources : [];
  const count = result.sourceCount ?? sources.length;
  const summary = `${count} document${count === 1 ? "" : "s"} récupéré${count === 1 ? "" : "s"}`;
  const documents = sources.flatMap((source, index) => {
    const label = source.label?.trim() || `Document ${index + 1}`;
    const snippet = source.snippet?.trim();
    return snippet ? [`${label} — ${snippet}`] : [label];
  });

  return [summary, ...documents];
}

function chartSurfaceLine(part: { id: string; data: unknown }): string {
  // One line per A2UI surface emission. The envelope discriminator
  // (createSurface / updateComponents / deleteSurface) tells the
  // operator what kind of surface change happened.
  const data = part.data;
  if (data && typeof data === "object") {
    if ("createSurface" in data) {
      const cs = (data as { createSurface: { catalogId?: string } })
        .createSurface;
      return `Surface A2UI créée : ${part.id} (${cs?.catalogId ?? "brh/v1"})`;
    }
    if ("updateComponents" in data) {
      return `Composants A2UI mis à jour : ${part.id}`;
    }
    if ("updateDataModel" in data) {
      return `Données A2UI mises à jour : ${part.id}`;
    }
    if ("deleteSurface" in data) {
      return `Surface A2UI supprimée : ${part.id}`;
    }
  }
  return `Surface A2UI : ${part.id}`;
}

function traceLines(parts: UIMessage["parts"]): string[] {
  return parts.flatMap((part) => {
    if (part.type === "reasoning") {
      return part.text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    // A2UI surfaces arrive as ``data-a2ui`` custom parts; surface
    // a single trace line per part so the operator sees when a
    // chart / table / form landed on the user’s canvas.
    if (part.type === "data-a2ui") {
      const a2uiPart = part as unknown as {
        id: string;
        data: unknown;
      };
      return [chartSurfaceLine(a2uiPart)];
    }

    const [tool] = toolParts([part]);
    if (!tool) return [];

    const name = tool.toolName ?? "outil de recherche";
    const callLine = `Appel de l’outil ${name}`;
    if (tool.state === "output-available") {
      return [callLine, `Résultat reçu de ${name}`, ...retrievalLines(tool.output)];
    }
    if (tool.state === "output-error") {
      return [callLine, `Erreur de ${name} — ${tool.errorText ?? "échec de l’outil"}`];
    }
    if (tool.state === "output-denied") {
      return [callLine, `Accès refusé pour ${name}`];
    }
    return [callLine];
  });
}

export function AgentTrace({ parts, streaming }: AgentTraceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => traceLines(parts), [parts]);
  const traceText = lines.join("\n");
  const visibleTrace = useSmoothStreamingText(traceText, streaming, {
    baseCps: 100,
    maxCps: 240,
    minCps: 32,
    lagChars: 60,
  });

  useEffect(() => {
    console.debug("[brh.agent-trace] update", {
      parts: parts.map((part) => ({
        type: part.type,
        state: "state" in part ? part.state : undefined,
        text:
          part.type === "reasoning" ? part.text.slice(0, 160) : undefined,
      })),
      lines,
    });
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [parts, lines, visibleTrace]);

  if (lines.length === 0) return null;

  return (
    <div className="relative h-24 overflow-hidden rounded-md bg-muted/30 text-xs text-muted-foreground shadow-[inset_0_10px_10px_-12px_hsl(var(--foreground)),inset_0_-10px_10px_-12px_hsl(var(--foreground))]">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="whitespace-pre-wrap font-mono leading-4">
          {visibleTrace}
        </div>
      </div>
    </div>
  );
}

export { retrievalLines, traceLines };
