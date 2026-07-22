/* ---------------------------------------------------------------------------
 * Chart color palette.
 *
 * Reads from the BRH design tokens at runtime so charts pick up
 * theme changes (dark mode, future rebrand). Falls back to a
 * hand-picked OKLCH sequence when CSS variables are not present
 * (e.g. server-side rendering before stylesheet hydration). The
 * values are committed in the BRH UI/UX doc; see the alias
 * `--chart-1` ... `--chart-6` tokens.
 * ------------------------------------------------------------------------- */

const PALETTE_FALLBACK: readonly string[] = [
  "oklch(0.55 0.18 250)", // primary blue
  "oklch(0.62 0.16 180)", // teal
  "oklch(0.66 0.18 60)", // amber
  "oklch(0.55 0.20 320)", // magenta
  "oklch(0.62 0.18 100)", // lime
  "oklch(0.58 0.18 0)", // red
];

/**
 * Resolve a color from the palette at index ``i`` (wraps modulo).
 * ``alpha`` < 1 produces a translucent variant for area fills.
 *
 * NOTE: the alpha-blend path assumes each palette entry contains
 * exactly one ``)`` — true today (flat ``oklch(...)`` strings). If
 * you switch to multi-paren forms (e.g. ``color-mix(in oklch, ...)``
 * nested) the ``replace(")", ...)`` will be wrong; rewrite as a
 * parser at that point.
 */
export function paletteColor(i: number, alpha = 1): string {
  const base = paletteAt(i);
  if (alpha === 1) return base;
  return base.replace(")", ` / ${alpha})`);
}

/**
 * Read a chart color token from CSS variables, falling back to the
 * hardcoded palette. Runs on the client only — during SSR we
 * return the fallback (acceptable: the chart re-renders after
 * hydration with the real value).
 */
function paletteAt(i: number): string {
  if (typeof window === "undefined") {
    return PALETTE_FALLBACK[i % PALETTE_FALLBACK.length];
  }
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const tokenIndex = (i % PALETTE_FALLBACK.length) + 1;
  const token = computed.getPropertyValue(`--chart-${tokenIndex}`).trim();
  return token || PALETTE_FALLBACK[i % PALETTE_FALLBACK.length];
}
