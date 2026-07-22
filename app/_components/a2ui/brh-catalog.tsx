"use client";

/* ---------------------------------------------------------------------------
 * BRH A2UI catalog.
 *
 * Wraps the standard basic catalog (Text, Row, Column, Card, Button, …)
 * and adds our single custom component: `Chart`, which renders a
 * Chart.js canvas via `react-chartjs-2`.
 *
 * Export surface:
 *   - `BRH_CATALOG_ID` — the catalog id; the server must use exactly
 *     this string in `createSurface.catalogId`.
 *   - `brhCatalog` — the Catalog instance, ready for MessageProcessor
 *   - `createBrhMessageProcessor` — factory that wires the catalog +
 *     a fresh `MessageProcessor`
 *   - `CHART_PAYLOAD_SCHEMA` — Zod schema for the `Chart` props, also
 *     re-used by the fixture route and (later) by the server-side
 *     payload validator.
 *
 * Catalog id: `brh/v1`. See docs/architecture/a2ui-charts-design.md §7.
 * ------------------------------------------------------------------------- */

import { z } from "zod";
import {
  BASIC_COMPONENTS,
  Catalog,
  MessageProcessor,
  type ComponentApi,
} from "@a2ui/web_core/v0_9";
import {
  type ReactComponentImplementation,
  createBinderlessComponentImplementation,
} from "@a2ui/react/v0_9";

import { ChartRenderer, type ChartProps } from "./chart-renderer";

export const CHART_PAYLOAD_SCHEMA = z.object({
  chartType: z.enum(["line", "bar", "pie", "doughnut"]),
  title: z.string().optional(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  data: z.object({
    labels: z.array(z.string()),
    datasets: z.array(
      z.object({
        label: z.string(),
        values: z.array(z.number()),
      }),
    ),
  }),
});

export type ChartPayload = z.infer<typeof CHART_PAYLOAD_SCHEMA>;

const ChartApi: ComponentApi<typeof CHART_PAYLOAD_SCHEMA> = {
  name: "Chart",
  schema: CHART_PAYLOAD_SCHEMA,
};

const ChartImpl: ReactComponentImplementation = createBinderlessComponentImplementation(
  ChartApi,
  ({ context }) => {
    const props = context.componentModel.properties as ChartProps;
    return <ChartRenderer {...props} />;
  },
);

/* ---------------------------------------------------------------------------
 * Catalog + MessageProcessor factory
 * ------------------------------------------------------------------------- */

export const BRH_CATALOG_ID = "brh/v1";

/* ``BASIC_COMPONENTS`` is typed as ``ComponentApi[]`` in the v0.9
 * package, but at runtime every entry is already a
 * ``ReactComponentImplementation`` (which is a ``ComponentApi``
 * subtype). The widen is the package's lossy type; we cast through
 * ``unknown`` to satisfy both the input shape and our catalog
 * parameter. */
export const brhCatalog: Catalog<ReactComponentImplementation> = new Catalog(
  BRH_CATALOG_ID,
  [...BASIC_COMPONENTS, ChartImpl] as unknown as ReactComponentImplementation[],
);

/**
 * Create a fresh `MessageProcessor` bound to the BRH catalog.
 *
 * One processor per assistant message — call `process(envelopes)` to
 * feed it A2UI envelopes, then read `processor.model.surfacesMap` to
 * mount `<A2uiSurface>` instances.
 */
export function createBrhMessageProcessor(): MessageProcessor<ReactComponentImplementation> {
  return new MessageProcessor([brhCatalog]);
}
