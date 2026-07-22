const TAG = "[brh.route]";

type StreamLogFrame = {
  type?: string;
  delta?: string;
  title?: string;
  output?: unknown;
  input?: unknown;
};

function log(line: string): void {
  process.stdout.write(`${TAG} ${line}\n`);
}

function frameDetails(frame: StreamLogFrame): string[] {
  const detail: string[] = [];
  if (frame.type === "text-delta" && typeof frame.delta === "string") {
    detail.push(`delta.len=${frame.delta.length}`);
    if (frame.delta.length < 80) {
      detail.push(`delta=${JSON.stringify(frame.delta)}`);
    }
  }
  if (frame.type === "reasoning-delta" && typeof frame.delta === "string") {
    detail.push(`delta.len=${frame.delta.length}`);
  }
  if (frame.type === "source-document") {
    detail.push(`title=${JSON.stringify(frame.title)}`);
  }
  if (frame.type === "tool-input-available" && frame.input) {
    const input = JSON.stringify(frame.input);
    detail.push(`input.len=${input.length}`);
  }
  if (frame.type === "tool-output-available") {
    detail.push(`output=${JSON.stringify(frame.output)}`);
  }
  return detail;
}

export function createStreamLoggingTransform(
  requestId: string,
  startedAt: number,
): TransformStream<Uint8Array, Uint8Array> {
  let frameCount = 0;
  const seenTypes = new Set<string>();
  let buffer = "";
  const decoder = new TextDecoder();

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const elapsed = Date.now() - startedAt;
      buffer += decoder.decode(chunk, { stream: true });

      let separator: number;
      while ((separator = buffer.indexOf("\n\n")) !== -1) {
        const piece = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const line = piece.trim();
        if (!line.startsWith("data:")) continue;

        const json = line.slice(5).trim();
        if (json === "[DONE]") {
          log(
            `req=${requestId} +${elapsed}ms frame=[DONE] total=${frameCount}`,
          );
          continue;
        }

        try {
          const frame = JSON.parse(json) as StreamLogFrame;
          if (!frame.type) continue;
          frameCount += 1;
          seenTypes.add(frame.type);
          const detail = frameDetails(frame);
          log(
            `req=${requestId} +${elapsed}ms frame#${frameCount} type=${frame.type}${
              detail.length ? ` ${detail.join(" ")}` : ""
            }`,
          );
        } catch {
          log(
            `req=${requestId} +${elapsed}ms frame.parse_error len=${json.length}`,
          );
        }
      }

      controller.enqueue(chunk);
    },
    flush() {
      const elapsed = Date.now() - startedAt;
      log(
        `req=${requestId} flush +${elapsed}ms frames=${frameCount} types=${JSON.stringify(
          Array.from(seenTypes).sort(),
        )}`,
      );
    },
  });
}

export { log };
