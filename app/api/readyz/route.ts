import { log } from "../chat/stream-logging";

export const dynamic = "force-dynamic";

type ReadyzResponse =
  | { status: "ready"; missing: [] }
  | { status: "warming"; missing: string[] }
  | { status: "unreachable"; reason: string };

export async function GET(): Promise<Response> {
  const backendUrl =
    process.env.BRH_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
  const upstreamUrl = `${backendUrl}/readyz`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const upstream = await fetch(upstreamUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (upstream.status === 200) {
      log(`readyz → 200 ready`);
      const body: ReadyzResponse = { status: "ready", missing: [] };
      return Response.json(body, { status: 200 });
    }

    let missing: string[] = [];
    try {
      const parsed = (await upstream.json()) as { missing?: string[] };
      missing = Array.isArray(parsed.missing) ? parsed.missing : [];
    } catch {}
    log(`readyz → ${upstream.status} warming missing=${JSON.stringify(missing)}`);
    const body: ReadyzResponse = { status: "warming", missing };
    return Response.json(body, { status: 200 });
  } catch (err) {
    clearTimeout(timeout);
    const reason = err instanceof Error ? err.message : "unknown";
    log(`readyz → unreachable reason=${reason}`);
    const body: ReadyzResponse = { status: "unreachable", reason };
    return Response.json(body, { status: 200 });
  }
}
