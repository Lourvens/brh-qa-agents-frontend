import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { MessageResponse } from "@/components/ai-elements/message";
import { useMemo } from "react";
import type { UIMessage } from "ai";

import { useSmoothStreamingText } from "@/hooks/useSmoothStreamingText";
import { AgentStatus } from "./AgentStatus";
import { AgentTrace } from "./AgentTrace";
import {
  agentPhase,
  sourceParts,
  textParts,
} from "../_lib/message-parts";

/**
 * Renders the dynamic agent status, streamed answer, and source citations.
 */
export function AssistantParts({
  parts,
  streaming,
}: {
  parts: UIMessage["parts"];
  streaming: boolean;
}) {
  const sources = useMemo(() => sourceParts(parts), [parts]);
  const body = useMemo(() => textParts(parts), [parts]);
  const phase = useMemo(() => agentPhase(parts, streaming), [parts, streaming]);
  // Smooth character reveal — buffers SSE deltas and releases them at a
  // controlled cps so the user sees a steady stream rather than bursty
  // chunks. See hooks/useSmoothStreamingText.ts.
  const visibleBody = useSmoothStreamingText(body, streaming);

  return (
    <div className="space-y-3">
      <AgentStatus phase={phase} />
      {streaming ? <AgentTrace parts={parts} streaming /> : null}

      {visibleBody || streaming ? (
        <MessageResponse streaming={streaming}>{visibleBody}</MessageResponse>
      ) : null}

      {sources.length > 0 ? (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((source, i) => (
              <Source
                key={source.sourceId ?? `src-${i}`}
                title={source.title ?? "Source"}
              >
                {source.title ?? "Source"}
              </Source>
            ))}
          </SourcesContent>
        </Sources>
      ) : null}
    </div>
  );
}
