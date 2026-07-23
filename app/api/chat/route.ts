import { UIMessage } from "ai";

import { createStreamLoggingTransform, log } from "./stream-logging";

export const dynamic = "force-dynamic";
// 10 minutes — the longest observed Pinecone retrieval + Claude
// reasoning chain on the Modal backend fits well inside this window.
// Vercel's default 60s ceiling cuts off mid-stream on multi-tool
// runs (long A2UI chart payloads); bumping this on the Hobby plan
// lifts that ceiling without any other change required.
export const maxDuration = 600;

type HistoryTurn = { role: "user" | "assistant"; content: string };

function textOf(parts: UIMessage["parts"]): string {
  let out = "";
  for (const part of parts ?? []) {
    if (part.type === "text") out += part.text;
  }
  return out.trim();
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = textOf(message.parts);
    if (text) return text;
  }
  return "";
}

function serializeHistory(messages: UIMessage[]): HistoryTurn[] {
  const out: HistoryTurn[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const message = messages[i];
    if (message.role !== "user" && message.role !== "assistant") continue;
    const content = textOf(message.parts);
    if (content) out.push({ role: message.role, content });
  }
  return out;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestId = Math.random().toString(36).slice(2, 8);
  const body = (await req.json()) as { messages?: UIMessage[] };
  const messages = body.messages ?? [];
  const question = lastUserText(messages);
  const history = serializeHistory(messages);

  log(
    `POST req=${requestId} q.len=${question.length} history.len=${history.length}`,
  );

  if (!question.trim()) {
    log(`req=${requestId} reject empty`);
    return new Response(JSON.stringify({ error: "empty_question" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const backendUrl =
    process.env.BRH_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
  log(`req=${requestId} upstream → ${backendUrl}/ask`);

  const upstreamBody = { question, history };
  log(
    `req=${requestId} upstream.POST body=${JSON.stringify(upstreamBody).slice(0, 240)}`,
  );
  const upstream = await fetch(`${backendUrl}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upstreamBody),
    signal: req.signal,
  });

  if (!upstream.ok || !upstream.body) {
    let upstreamFailureBody = "";
    try {
      upstreamFailureBody = await upstream.text();
    } catch {}
    log(
      `req=${requestId} upstream.error status=${upstream.status} body=${upstreamFailureBody.slice(0, 400)}`,
    );
    return new Response(
      JSON.stringify({
        error: "backend_unavailable",
        status: upstream.status,
        upstreamBody: upstreamFailureBody.slice(0, 400),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  const transform = createStreamLoggingTransform(requestId, startedAt);
  const piped = upstream.body.pipeThrough(transform);

  return new Response(piped, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}
