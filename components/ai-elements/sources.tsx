"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BookIcon, ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback } from "react";

/* ---------------------------------------------------------------------------
 * Sources — collapsible footer listing the citations the agent used.
 *
 * Visual: a thin "Voir les N sources" trigger that opens a chip grid. Each
 * chip mirrors the BRH RDDCF citation convention (volume — numéro — topic)
 * and links out when the backend hands us a URL; otherwise it renders as a
 * static label so we never expose a broken anchor.
 *
 * a11y: the trigger is a real <button>; the chevron rotation is driven by
 * aria-state so screen readers announce the open/close transition.
 * ------------------------------------------------------------------------- */

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    aria-label="Sources de la réponse"
    className={cn(
      "not-prose mt-3 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-foreground text-xs",
      className,
    )}
    {...props}
  />
);

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "group flex w-fit items-center gap-2 rounded-md px-2 py-1 font-medium text-accent text-xs",
      "transition-colors hover:bg-accent/10 focus-visible:bg-accent/10",
      className,
    )}
    {...props}
  >
    {children ?? (
      <>
        <BookIcon className="size-3.5" aria-hidden />
        <span>
          {count > 1
            ? `Voir les ${count} sources`
            : count === 1
              ? "Voir la source"
              : "Aucune source"}
        </span>
        <ChevronDownIcon
          aria-hidden
          className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </>
    )}
  </CollapsibleTrigger>
);

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-2 flex flex-wrap gap-2 outline-none",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      className,
    )}
    {...props}
  />
);

/* --- Source chip ----------------------------------------------------------- */

export type SourceProps = Omit<ComponentProps<"a">, "title"> & {
  /** Optional citation label (e.g. "Vol. 3 — n°1 — Inclusion financière"). */
  title?: string;
  /**
   * Optional deep-link. When present, the chip is rendered as a real
   * anchor with `target=_blank` + `rel=noopener noreferrer`. When absent
   * it falls back to a static `<span>` so we never emit a broken link.
   */
  href?: string;
};

export const Source = ({
  className,
  href,
  title,
  children,
  ...props
}: SourceProps) => {
  const label =
    typeof children === "string"
      ? children
      : (title ?? "Source");

  const chipClasses = cn(
    "group/chip inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5",
    "text-foreground text-xs shadow-sm",
    "transition-all duration-150",
    "hover:-translate-y-px hover:border-accent/60 hover:shadow",
    "focus-visible:-translate-y-px focus-visible:border-accent",
    className,
  );

  const inner = (
    <>
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
      >
        <BookIcon className="size-2.5" />
      </span>
      <span className="line-clamp-2 max-w-[28ch] font-medium leading-snug">
        {label}
      </span>
      {href ? (
        <ExternalLinkIcon
          aria-hidden
          className="size-3 text-muted-foreground transition-colors group-hover/chip:text-accent"
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        className={chipClasses}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        {...(props as React.ComponentProps<"a">)}
      >
        {inner}
      </a>
    );
  }
  return (
    <span className={chipClasses} {...(props as React.ComponentProps<"span">)}>
      {inner}
    </span>
  );
};

/** Re-export a typed Button for callers that want a custom trigger. */
export const SourcesButton = Button;
