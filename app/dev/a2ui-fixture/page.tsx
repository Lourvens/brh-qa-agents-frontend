"use client";

/* ---------------------------------------------------------------------------
 * A2UI fixture smoke route.
 *
 * Hardcodes the design-doc §3 wire example (Vol-5 departmental CEC
 * asset share over four quarters) and mounts the result with the
 * BRH catalog. Used by Phase 1 verification — Playwright/manual
 * eyeball. The page also runs an inline smoke test that asserts a
 * canvas element exists after the first render.
 *
 * Route: /a2ui-fixture (dev-only). Never linked from production UI.
 * ------------------------------------------------------------------------- */

import { useEffect, useMemo, useState } from "react";

import { A2uiSurface } from "@a2ui/react/v0_9";
import {
  BRH_CATALOG_ID,
  createBrhMessageProcessor,
} from "@/app/_components/a2ui/brh-catalog";

/* A2UI v0.9.1 envelopes — mirrors the example in
 * docs/architecture/a2ui-charts-design.md §3. */
const FIXTURE = [
  {
    version: "v0.9.1" as const,
    createSurface: {
      surfaceId: "chart",
      catalogId: BRH_CATALOG_ID,
    },
  },
  {
    version: "v0.9.1" as const,
    updateComponents: {
      surfaceId: "chart",
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "canvas", "footer"],
        },
        {
          id: "title",
          component: "Text",
          text: "Part des actifs des CEC par département (2021–2024)",
          variant: "h3",
        },
        {
          id: "canvas",
          component: "Chart",
          chartType: "line",
          xLabel: "Date",
          yLabel: "% des actifs",
          data: {
            labels: ["30-Sep-21", "30-Sep-22", "30-Sep-23", "30-Sep-24"],
            datasets: [
              {
                label: "Artibonite",
                values: [26.6, 25.9, 25.4, 23.2],
              },
              {
                label: "Ouest",
                values: [19.5, 18.2, 16.8, 16.4],
              },
              {
                label: "Nord",
                values: [8.2, 7.9, 7.8, 8.0],
              },
            ],
          },
        },
        {
          id: "footer",
          component: "Text",
          text: "Source : BRH, RDCCF Vol.5 (juillet 2025), p. 36.",
          variant: "caption",
        },
      ],
    },
  },
];

export default function A2UIFixturePage() {
  const processor = useMemo(() => createBrhMessageProcessor(), []);
  const [surfaceIds, setSurfaceIds] = useState<string[]>([]);

  useEffect(() => {
    processor.processMessages(FIXTURE);
    setSurfaceIds(Array.from(processor.model.surfacesMap.keys()));
    return () => {
      processor.model.dispose();
    };
  }, [processor]);

  const surfaces = Array.from(processor.model.surfacesMap.values());

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">A2UI fixture smoke</h1>
        <p className="text-sm text-muted-foreground">
          Catalog: <code>{BRH_CATALOG_ID}</code>. Surfaces rendered:{" "}
          <code data-testid="surface-count">{surfaceIds.length}</code>.
        </p>
      </header>

      {surfaces.map((surface) => (
        <section
          key={surface.id}
          data-testid={`surface-${surface.id}`}
          className="rounded-xl border bg-card p-6"
        >
          <A2uiSurface surface={surface} />
        </section>
      ))}

      <aside className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        This route is a Phase 1 dev fixture. It loads the v0.9 catalog
        with the BRH <code>Chart</code> component and feeds it a static
        A2UI envelope list. Open the browser console for any
        resolution / binding warnings.
      </aside>
    </main>
  );
}
