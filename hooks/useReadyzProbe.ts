"use client";

import { useEffect, useState } from "react";

export type ReadyzState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "ready" }
  | { status: "warming"; missing: string[] }
  | { status: "unreachable" };

const PROBE_AFTER_MS = 8000;
const REPROBE_INTERVAL_MS = 15000;
const MAX_REPROBES = 4;

type RawProbe =
  | { status: "ready"; missing: [] }
  | { status: "warming"; missing: string[] }
  | { status: "unreachable"; reason: string };

async function probeOnce(): Promise<RawProbe> {
  try {
    const res = await fetch("/api/readyz", { cache: "no-store" });
    if (!res.ok) throw new Error(`status=${res.status}`);
    return (await res.json()) as RawProbe;
  } catch (err) {
    return {
      status: "unreachable",
      reason: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/**
 * Polls the backend `/readyz` proxy while `enabled` is true. Designed for
 * the cold-start window of Render free-tier: probes once after 8s, then
 * every 15s up to 4 retries. Stops probing once a terminal state is
 * reached (ready / unreachable) so we don't keep hammering a healthy or
 * dead backend.
 */
export function useReadyzProbe(enabled: boolean): ReadyzState {
  const [state, setState] = useState<ReadyzState>({ status: "idle" });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "pending" });
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const run = async () => {
      const raw = await probeOnce();
      if (cancelled) return;
      if (raw.status === "ready") {
        setState({ status: "ready" });
        return;
      }
      if (raw.status === "unreachable") {
        setState({ status: "unreachable" });
        return;
      }
      attempt += 1;
      setState({ status: "warming", missing: raw.missing });
      if (attempt < MAX_REPROBES) {
        timer = setTimeout(run, REPROBE_INTERVAL_MS);
      }
    };

    timer = setTimeout(run, PROBE_AFTER_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  return state;
}
