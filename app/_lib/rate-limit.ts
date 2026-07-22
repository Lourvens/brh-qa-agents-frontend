/* Parse a useChat() error into a typed RateLimitInfo, or null.

The backend's /ask rate limiter (ADR-0027) raises HTTPException(429)
with a JSON body and a small set of X-RateLimit-* headers. The AI SDK's
useChat hook surfaces the status code via the error's cause chain --
the actual Response is reachable through a few possible shapes
depending on which transport emitted it, so this helper tries all of
them and returns the first match.

The output is the shape the rate-limit modal needs:

  RateLimitInfo = {
    scope: 'user' | 'global';
    limit: number;
    resetInSeconds: number;     // X-RateLimit-Reset (seconds-from-now or epoch)
    resetAt: number | null;     // epoch-seconds, parsed
  }

resetInSeconds is shown as a fixed time-of-day in the modal -- no live
countdown per the v1 UX call. We surface the absolute reset time so
the user knows exactly when to come back.
*/

export type RateLimitScope = "user" | "global";

export type RateLimitInfo = {
  scope: RateLimitScope;
  limit: number;
  resetInSeconds: number;
  resetAt: number | null;
};

const SCOPE_VALUES = new Set<RateLimitScope>(["user", "global"]);

/**
 * Walk the error chain looking for the fetch `Response`. The AI SDK
 * (v4+) attaches the response to `err.cause`; some transports wrap
 * it one level deeper via `err.cause.cause`; older versions used
 * `err.statusCode`. We check the common shapes.
 */
function findResponse(error: unknown): Response | null {
  const seen = new Set<unknown>();
  let current: unknown = error;
  for (let i = 0; i < 5 && current != null && !seen.has(current); i++) {
    seen.add(current);
    if (typeof current === "object" && current !== null) {
      const e = current as Record<string, unknown>;
      if (e.response instanceof Response) return e.response;
      if (e.cause !== undefined) {
        current = e.cause;
        continue;
      }
      // Some error shapes embed status + headers directly.
      if (typeof e.status === "number" && e.headers && typeof e.headers === "object") {
        const status = e.status;
        const headers = e.headers as Record<string, string>;
        // Synthesize a Response-like object that satisfies our reader.
        return new Response(e.body as BodyInit | null, { status, headers });
      }
    }
    break;
  }
  return null;
}

function readHeader(headers: Headers, name: string): string | null {
  const v = headers.get(name);
  return v && v.length > 0 ? v : null;
}

/** Read `X-RateLimit-Reset` as either epoch-seconds or seconds-from-now. */
function parseReset(resetHeader: string | null, nowEpochSec: number): number | null {
  if (!resetHeader) return null;
  const n = Number(resetHeader);
  if (!Number.isFinite(n)) return null;
  // If the value is much larger than a 24h window in seconds, treat
  // it as an absolute epoch; otherwise it's already a delta.
  const oneDaySec = 24 * 60 * 60;
  if (n > oneDaySec * 2) return n;
  return nowEpochSec + n;
}

/** Format an epoch-second timestamp as a short French "HH:MM" string. */
export function formatResetTime(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Pretty-format `resetInSeconds` as "dans X heures" / "dans Y minutes". */
export function formatResetDelay(resetInSeconds: number): string {
  if (resetInSeconds <= 60) return "dans quelques secondes";
  if (resetInSeconds < 60 * 60) {
    const m = Math.ceil(resetInSeconds / 60);
    return `dans ${m} minute${m > 1 ? "s" : ""}`;
  }
  const h = Math.ceil(resetInSeconds / 3600);
  return `dans ${h} heure${h > 1 ? "s" : ""}`;
}

/**
 * Extract a typed `RateLimitInfo` from a `useChat` error, or `null`
 * if the error is not a 429 from our rate limiter.
 *
 * Tests pin the success path (full headers), the missing-headers
 * path (status-only), and the not-a-rate-limit path (other error
 * shapes).
 */
export function parseRateLimit(error: unknown): RateLimitInfo | null {
  if (!error) return null;
  const response = findResponse(error);
  if (!response || response.status !== 429) return null;

  const scopeHeader = readHeader(response.headers, "X-RateLimit-Scope");
  const limitHeader = readHeader(response.headers, "X-RateLimit-Limit");
  const resetHeader = readHeader(response.headers, "X-RateLimit-Reset");
  const scope = scopeHeader && SCOPE_VALUES.has(scopeHeader as RateLimitScope)
    ? (scopeHeader as RateLimitScope)
    : null;
  const limit = limitHeader ? Number(limitHeader) : NaN;
  const nowEpochSec = Math.floor(Date.now() / 1000);
  const resetAt = parseReset(resetHeader, nowEpochSec);
  const resetInSeconds = resetAt !== null ? Math.max(0, resetAt - nowEpochSec) : 0;

  if (!scope || !Number.isFinite(limit)) return null;
  return {
    scope,
    limit,
    resetInSeconds,
    resetAt,
  };
}

/**
 * Human-readable summary used in the modal. Centralized so the
 * copy + formatting stays consistent across surfaces.
 */
export function rateLimitMessage(info: RateLimitInfo): {
  title: string;
  body: string;
  scopeLabel: string;
} {
  if (info.scope === "global") {
    return {
      title: "Service temporairement limité",
      body: `Le service a atteint sa limite quotidienne de ${info.limit} requêtes. Réessayez plus tard${info.resetAt ? ` (vers ${formatResetTime(info.resetAt)})` : ""}.`,
      scopeLabel: "Limite globale",
    };
  }
  return {
    title: "Limite de requêtes atteinte",
    body: `Vous avez atteint la limite de ${info.limit} requêtes par jour. Réessayez plus tard${info.resetAt ? ` (vers ${formatResetTime(info.resetAt)})` : ""}.`,
    scopeLabel: "Limite par utilisateur",
  };
}
