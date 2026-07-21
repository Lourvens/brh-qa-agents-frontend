"use client";

/**
 * Smooth text-streaming reveal.
 *
 * Source material:
 *  - "Smooth Text Streaming in AI SDK v5" — Upstash (rAF batching).
 *  - "Streaming Tokens Without Layout Thrash" — Frontend Casebook.
 *  - coder/coder PR #22503 — SmoothTextEngine (adaptive 72→420 cps,
 *    120-char max visual lag, clean flush on stream end).
 *  - "Designing AI chat interfaces" — Setproduct (UIUX).
 *
 * The hook drives a single self-scheduling `requestAnimationFrame` loop
 * that reads `fullRef.current` each frame and writes to `visible`
 * state. `fullText` arrives in bursts from the SSE wire; this loop
 * reveals characters at a controlled cps so the user perceives a
 * steady, readable stream instead of bursty chunking.
 *
 *   • Adaptive cps:  lag < `lagChars`         → `baseCps`
 *                    lag > `lagChars * 3`     → `maxCps` (catch up)
 *                    lag ≥  `lagChars`        → linear blend
 *                    lag <  ~8 chars          → `minCps` (readable tail)
 *   • Clean flush:   if `enabled` flips false, snap to full.
 *   • Reduced-motion: collapses to instant render — no animation.
 *   • Single rAF; state updates gated to one per frame. React 19
 *     batches within a frame so a 60fps loop ~= 60 renders.
 */

import { useEffect, useRef, useState } from "react";

export interface UseSmoothStreamingTextOptions {
  /** Baseline reveal speed when the buffer is moderately behind. */
  baseCps?: number;
  /** Ceiling cps when far behind (catch-up mode). */
  maxCps?: number;
  /** Slow-down near completion so the user can read along. */
  minCps?: number;
  /** Backlog (chars of head-start the network has) at which adaptive
   *  catch-up kicks in. Below this, baseCps. */
  lagChars?: number;
  /** React state-update throttle (ms). The rAF loop runs every frame
   *  for cadence accuracy; the React `setVisible` update is throttled
   *  to ~30fps to keep CPU sane. Set to 0 to render every frame. */
  frameIntervalMs?: number;
  /** Override the user-prefers-reduced-motion heuristic if you want
   *  to force the behaviour. Default is automatic. */
  respectReducedMotion?: boolean;
}

const DEFAULTS = {
  baseCps: 140,
  maxCps: 320,
  minCps: 40,
  lagChars: 80,
  frameIntervalMs: 32,
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useSmoothStreamingText(
  fullText: string,
  enabled: boolean,
  options: UseSmoothStreamingTextOptions = {},
): string {
  const baseCps = options.baseCps ?? DEFAULTS.baseCps;
  const maxCps = options.maxCps ?? DEFAULTS.maxCps;
  const minCps = options.minCps ?? DEFAULTS.minCps;
  const lagChars = options.lagChars ?? DEFAULTS.lagChars;
  const frameIntervalMs = options.frameIntervalMs ?? DEFAULTS.frameIntervalMs;
  const reducedMotion =
    options.respectReducedMotion ?? prefersReducedMotion();

  const [visible, setVisible] = useState(fullText);

  // Mutable state held in refs so the rAF loop never restarts on
  // text/enabled changes — only the consumer state updates.
  const fullRef = useRef(fullText);
  fullRef.current = fullText;
  const shownRef = useRef(fullText.length);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const lastTickRef = useRef(0);
  const lastRenderRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Step function: held in a ref so callers outside this effect can
  // invoke it without hoisting it out of useEffect.
  const stepRef = useRef<(now: number) => void>(() => {});
  stepRef.current = (now: number) => {
    const total = fullRef.current.length;
    const shown = shownRef.current;
    const isStreaming = enabledRef.current;

    // Stream is over — clean flush.
    if (!isStreaming) {
      if (shown !== total) {
        shownRef.current = total;
        setVisible(fullRef.current);
      }
      rafRef.current = null;
      return;
    }

    // Caught up — idle until the buffer advances.
    if (shown >= total) {
      rafRef.current = null;
      return;
    }

    const backlog = total - shown;
    let cps: number;
    if (backlog > lagChars * 3) {
      // Far behind — clamp hard and accelerate to catch up.
      cps = maxCps;
    } else if (backlog > lagChars) {
      const t = (backlog - lagChars) / (lagChars * 2);
      cps = baseCps + (maxCps - baseCps) * t;
    } else if (backlog <= 8) {
      // Tail — slow down so the user reads along.
      cps = minCps;
    } else {
      cps = baseCps;
    }

    const last = lastTickRef.current || now;
    const dt = Math.max(0, now - last);
    lastTickRef.current = now;

    const reveal = Math.max(1, Math.round((cps * dt) / 1000));
    const next = Math.min(total, shown + reveal);
    shownRef.current = next;

    // Throttle the React update so Streamdown's markdown parser isn't
    // hammered 60×/sec on long responses. The rAF itself keeps running
    // every frame for cadence accuracy; we just hold the visible
    // rendering steady at ~30fps.
    if (now - lastRenderRef.current >= frameIntervalMs || next === total) {
      lastRenderRef.current = now;
      setVisible(fullRef.current.slice(0, next));
    }

    rafRef.current = next < total ? requestAnimationFrame(stepRef.current!) : null;
  };

  // Cleanup on unmount only — single mount, refs everywhere.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Re-evaluate on each network delta / stream-end transition:
  //  • content shortened (regeneration or message rewrite)  → snap
  //  • stream ended but visible is still behind             → clean flush
  //  • stream active and we're behind                       → kick rAF
  useEffect(() => {
    if (reducedMotion || !enabled) {
      // Snappy UX: never animate, always render the latest.
      shownRef.current = fullText.length;
      setVisible(fullText);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (fullText.length < shownRef.current) {
      // Content shrank — snap.
      shownRef.current = fullText.length;
      setVisible(fullText);
      return;
    }

    if (
      shownRef.current < fullRef.current.length &&
      rafRef.current == null
    ) {
      lastTickRef.current = 0;
      lastRenderRef.current = 0;
      rafRef.current = requestAnimationFrame(stepRef.current!);
    }
  }, [fullText, enabled, reducedMotion]);

  return visible;
}
