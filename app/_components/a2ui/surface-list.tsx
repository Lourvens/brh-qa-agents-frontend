"use client";

/* ---------------------------------------------------------------------------
 * Per-message A2UI surface list.
 *
 * The backend emits ONE ``data-a2ui`` custom data part per surface
 * (a single ``createSurface`` envelope with the component tree
 * inline). ``useChat`` reconciles by id — so this list iterates
 * ``message.parts``, filters for the ``data-a2ui`` discriminator,
 * and renders one ``<A2uiSurface>`` per envelope.
 *
 * Why one envelope per surface (not two — ``createSurface`` +
 * ``updateComponents`` sharing the same id): the Vercel AI SDK
 * reconciles by id, so two parts with the same id collapse to
 * the latest and the ``createSurface`` is lost — the renderer
 * then throws "Surface not found". The A2UI v0.9 spec supports
 * ``createSurface.components`` (inline tree) so a single envelope
 * is sufficient.
 *
 * Streaming + reconciliation behaviour:
 *
 * - During streaming, ``useChat`` updates the part in place as
 *   new frames arrive. With our single-envelope wire, the part's
 *   data is a complete surface from the very first frame after
 *   ``finish``; the surface mounts immediately when the part
 *   lands.
 * - Errors during processing (unknown envelope, schema mismatch)
 *   are caught and rendered as a small inline notice, not as a
 *   crash — the prose answer continues to render below.
 * ------------------------------------------------------------------------- */

import { useMemo } from "react";
import { A2uiSurface } from "@a2ui/react/v0_9";
import type { A2uiMessage } from "@a2ui/web_core/v0_9";
import type { UIMessage } from "ai";

import {
  createBrhMessageProcessor,
  BRH_CATALOG_ID,
} from "./brh-catalog";

type A2UIPart = {
  type: "data-a2ui";
  id: string;
  data: unknown;
};

function isA2UIPart(part: UIMessage["parts"][number]): part is A2UIPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    (part as { type: string }).type === "data-a2ui"
  );
}

function a2uiParts(parts: UIMessage["parts"]): A2UIPart[] {
  return parts.filter(isA2UIPart);
}

type MountedSurface = {
  surfaceId: string;
  surface: ReturnType<
    ReturnType<typeof createBrhMessageProcessor>["model"]["getSurface"]
  >;
  error?: string;
};

export function A2uiSurfaceList({ parts }: { parts: UIMessage["parts"] }) {
  const surfaces = useMemo<MountedSurface[]>(() => {
    const list = a2uiParts(parts);
    if (list.length === 0) return [];
    return list.map((part): MountedSurface => {
      try {
        const processor = createBrhMessageProcessor();
        processor.processMessages([part.data] as A2uiMessage[]);
        const surface = processor.model.getSurface(part.id);
        if (!surface) {
          return {
            surfaceId: part.id,
            surface: undefined,
            error: "Surface absente après traitement",
          };
        }
        return { surfaceId: part.id, surface };
      } catch (err) {
        return {
          surfaceId: part.id,
          surface: undefined,
          error: err instanceof Error ? err.message : "Erreur de rendu A2UI",
        };
      }
    });
  }, [parts]);

  if (surfaces.length === 0) return null;

  return (
    <div
      className="space-y-3"
      data-testid="a2ui-surfaces"
      data-catalog={BRH_CATALOG_ID}
    >
      {surfaces.map(({ surfaceId, surface, error }) =>
        surface ? (
          <section
            key={surfaceId}
            data-testid={`a2ui-surface-${surfaceId}`}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <A2uiSurface surface={surface} />
          </section>
        ) : (
          <section
            key={surfaceId}
            data-testid={`a2ui-error-${surfaceId}`}
            className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground"
            role="status"
          >
            Surface A2UI {surfaceId} indisponible — {error ?? "inconnue"}.
          </section>
        ),
      )}
    </div>
  );
}
