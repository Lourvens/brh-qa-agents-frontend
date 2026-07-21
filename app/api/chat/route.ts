/**
 * The one-file adapter from ADR-0018.
 *
 * The Vercel AI SDK's `useChat` (client side) sends
 * `{ messages: UIMessage[] }` to /api/chat by default. The BRH
 * FastAPI backend (ADR-0017 / ADR-0018 of brh-intelligence-queryengine)
 * accepts `{ question: string, history?: {role, content}[] }` and
 * returns the Vercel AI SDK UI Message Stream Protocol (header
 * `x-vercel-ai-ui-message-stream: v1`, body lines like
 * `data: {"type":"text-delta",...}\n\n`).
 *
 * This route:
 * 1. extracts the latest user message text from `messages` as
 *    `question`,
 * 2. flattens the remaining turns (user + assistant, oldest
 *    first) to `{role, content}` pairs as `history`,
 * 3. POSTs `{ question, history }` to the backend,
 * 4. streams the backend response back to the client unchanged.
 *
 * The SDK on each side does its own transport work end to end.
 *
 * Instrumented (BRH observability / debug): every SSE frame the
 * backend yields is logged to stderr (and process.stdout) with a
 * `[brh.route]` prefix. We log per chunk so the diagnostic works
 * even for in-flight streams whose `flush()` never fires.
 */

import { UIMessage } from "ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TAG = "[brh.route]";

type HistoryTurn = { role: "user" | "assistant"; content: string };

function textOf(parts: UIMessage["parts"]): string {
  // Concatenate the text parts only — reasoning / tool / source
  // parts are wire metadata and would just bloat the prompt.
  let out = "";
  for (const part of parts ?? []) {
    if (part.type === "text") out += part.text;
  }
  return out.trim();
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const text = textOf(m.parts);
    if (text) return text;
  }
  return "";
}

/**
 * Flatten the prior conversation into `{role, content}` pairs
 * suitable for the backend's ``HistoryMessage`` model.
 *
 * The latest user message is excluded — it's already the new
 * ``question`` — and any turn with empty text is skipped so we
 * never forward a contentless frame.
 */
function serializeHistory(messages: UIMessage[]): HistoryTurn[] {
  const out: HistoryTurn[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const m = messages[i];
    if (m.role !== "user" && m.role !== "assistant") continue;
    const content = textOf(m.parts);
    if (!content) continue;
    out.push({ role: m.role, content });
  }
  return out;
}

function log(line: string): void {
  // process.stdout.write to avoid console.log's per-call flush
  // buffering muddling the timeline.
  process.stdout.write(`${TAG} ${line}\n`);
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const reqId = Math.random().toString(36).slice(2, 8);
  const body = (await req.json()) as { messages?: UIMessage[] };
  const messages = body.messages ?? [];
  const question = lastUserText(messages);
  const history = serializeHistory(messages);

  log(`POST req=${reqId} q.len=${question.length} history.len=${history.length}`);

  if (!question.trim()) {
    log(`req=${reqId} reject empty`);
    return new Response(
      JSON.stringify({ error: "empty_question" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const backendUrl =
    process.env.BRH_BACKEND_URL?.replace(/\/$/, "") ??
    "http://localhost:8000";

  log(`req=${reqId} upstream → ${backendUrl}/ask`);
  /* [brh.route] trace request body */
  const upstreamBody = { question, history };
  log(
    `req=${reqId} upstream.POST body=${JSON.stringify(upstreamBody).slice(0, 240)}`,
  );
  const upstream = await fetch(`${backendUrl}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upstreamBody),
    signal: req.signal,
  });

  if (!upstream.ok || !upstream.body) {
    /* [brh.route] trace upstream failure — capture the rejection body
       so the frontend can correlate it with the error banner. */
    let upstreamFailureBody = "";
    try {
      upstreamFailureBody = await upstream.text();
    } catch {}
    log(`req=${reqId} upstream.error status=${upstream.status} body=${upstreamFailureBody.slice(0, 400)}`);
    return new Response(
      JSON.stringify({
        error: "backend_unavailable",
        status: upstream.status,
        upstreamBody: upstreamFailureBody.slice(0, 400),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  // Wrap so we can log every chunk that passes through. Each
  // SSE frame is a `data: {...}\\n\\n` segment; we accumulate
  // across chunks because a frame can straddle a chunk boundary.
  let frameCount = 0;
  const seenTypes = new Set<string>();
  let buffer = "";
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const dt = Date.now() - t0;
      buffer += new TextDecoder().decode(chunk, { stream: true });
      // Emit complete frames
      let nl: number;
      while ((nl = buffer.indexOf("\n\n")) !== -1) {
        const piece = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        const line = piece.trim();
        if (line.startsWith("data:")) {
          const json = line.slice(5).trim();
          if (json === "[DONE]") {
            log(`req=${reqId} +${dt}ms frame=[DONE] total=${frameCount}`);
            continue;
          }
          try {
            const obj = JSON.parse(json) as {
              type?: string;
              delta?: string;
              id?: string;
              toolCallId?: string;
              sourceId?: string;
              title?: string;
              errorText?: string;
              output?: unknown;
            };
            if (obj?.type) {
              frameCount += 1;
              seenTypes.add(obj.type);
              const detail: string[] = [];
              if (obj.type === "text-delta" && typeof obj.delta === "string") {
                detail.push(`delta.len=${obj.delta.length}`);
                if (obj.delta.length < 80) detail.push(`delta=${JSON.stringify(obj.delta)}`);
              }
              if (obj.type === "reasoning-delta" && typeof obj.delta === "string") {
                detail.push(`delta.len=${obj.delta.length}`);
              }
              if (obj.type === "source-document") {
                detail.push(`title=${JSON.stringify(obj.title)}`);
              }
              if (obj.type === "tool-input-available" && obj.input) {
                const inputStr = JSON.stringify(obj.input);
                detail.push(`input.len=${inputStr.length}`);
              }
              if (obj.type === "tool-output-available") {
                detail.push(`output=${JSON.stringify(obj.output)}`);
              }
              log(
                `req=${reqId} +${dt}ms frame#${frameCount} type=${obj.type}${
                  detail.length ? " " + detail.join(" ") : ""
                }`,
              );
            }
          } catch {
            log(`req=${reqId} +${dt}ms frame.parse_error len=${json.length}`);
          }
        }
      }
      controller.enqueue(chunk);
    },
    flush() {
      const dt = Date.now() - t0;
      log(
        `req=${reqId} flush +${dt}ms frames=${frameCount} types=${JSON.stringify(
          Array.from(seenTypes).sort(),
        )}`,
      );
    },
  });

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
