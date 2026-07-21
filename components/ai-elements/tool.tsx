"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

/* ---------------------------------------------------------------------------
 * Tool — surfaces a tool-call part in the chat.
 *
 * Wired into `AssistantParts` so any `tool-invocation` part that
 * arrives via the AI SDK UI Message Stream Protocol renders as a
 * compact card (BRH operator-grade affordance, UIUX-PRINCIPLES §6).
 *
 * State machine:
 *   partial    → streaming args (typed character-by-character from the wire).
 *   input      → args are finalised, the tool is about to run / running.
 *   output     → tool produced a result; show it inline.
 *   error      → tool failed; show error text.
 *
 * AI SDK states this maps to: `tool-input-streaming`,
 * `tool-input-available`, `tool-output-available`, `tool-output-error`.
 * ------------------------------------------------------------------------- */

const COLLAPSE_EASE = [0.16, 1, 0.3, 1] as const;

export type ToolProps = ComponentProps<typeof Collapsible> & {
  /** Tool invocation lifecycle state. */
  state?:
    | "partial"
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  /** Tool name, e.g. `brh_corpus_search`. */
  name?: string;
  /** Tool call id (stable per call). */
  toolCallId?: string;
  /** Show the trigger expanded by default. */
  defaultOpen?: boolean;
};

/** Friendly FR label for the tool badge. */
function toolLabel(name: string | undefined): string {
  if (!name) return "Outil";
  if (name === "brh_corpus_search") return "Recherche dans la RDDCF";
  return name;
}

function StateIcon({ state }: { state: ToolProps["state"] }) {
  if (state === "output-error") {
    return <XCircleIcon aria-hidden className="size-3.5 text-destructive" />;
  }
  if (state === "output-available") {
    return <CheckCircle2Icon aria-hidden className="size-3.5 text-accent" />;
  }
  if (state === "input-available" || state === "input-streaming") {
    return (
      <Loader2Icon
        aria-hidden
        className="size-3.5 animate-spin text-muted-foreground"
      />
    );
  }
  return (
    <CircleDotIcon aria-hidden className="size-3.5 text-muted-foreground" />
  );
}

export const Tool = ({
  className,
  state = "output-available",
  name,
  toolCallId,
  defaultOpen = false,
  children,
  ...props
}: ToolProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const label = toolLabel(name);
  const isRunning = state === "input-available" || state === "input-streaming";

  return (
    <Collapsible
      className={cn(
        "not-prose rounded-lg border border-border/60 bg-card/50 shadow-xs",
        className,
      )}
      onOpenChange={setOpen}
      open={open}
      {...props}
    >
      <CollapsibleTrigger className="group/t flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              isRunning ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
            )}
          >
            <WrenchIcon className="size-3.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium text-foreground/90 text-sm">
              {label}
            </span>
            <span className="truncate font-mono text-[0.7rem] text-muted-foreground">
              {state === "output-error"
                ? "Échec"
                : isRunning
                  ? "Exécution…"
                  : state === "output-available"
                    ? "Terminé"
                    : "Appel"}
              {toolCallId ? ` · ${toolCallId}` : null}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <StateIcon state={state} />
          <motion.span
            aria-hidden
            className="flex shrink-0 items-center text-muted-foreground"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: COLLAPSE_EASE }}
          >
            <ChevronDownIcon className="size-3.5" />
          </motion.span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "overflow-hidden border-border/40 border-t text-foreground",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
        )}
      >
        <div className="space-y-2 px-3 py-2 text-xs">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export type ToolInputProps = ComponentProps<"div"> & {
  input?: unknown;
};

export function ToolInput({ className, input, children, ...props }: ToolInputProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        Arguments
      </p>
      {children ?? (
        <pre className="overflow-x-auto rounded-md bg-muted/60 px-2 py-1.5 font-mono text-[0.78rem] leading-relaxed">
          {input === undefined ? "(streaming…)" : JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

export type ToolOutputProps = ComponentProps<"div"> & {
  output?: unknown;
  errorText?: string;
};

export function ToolOutput({
  className,
  output,
  errorText,
  children,
  ...props
}: ToolOutputProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <p
        className={cn(
          "font-medium text-xs uppercase tracking-wider",
          errorText ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {errorText ? "Erreur" : "Résultat"}
      </p>
      {children ?? (
        <pre className="max-h-64 overflow-auto rounded-md bg-muted/60 px-2 py-1.5 font-mono text-[0.78rem] leading-relaxed">
          {errorText
            ? errorText
            : output === undefined
              ? "(en attente)"
              : typeof output === "string"
                ? output
                : JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** Convenience renderer — read everything off a typed tool-invocation part. */
export function ToolFromPart({
  part,
  defaultOpen = false,
}: {
  part: {
    type?: string;
    state?:
      | "partial"
      | "input-streaming"
      | "input-available"
      | "output-available"
      | "output-error";
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  defaultOpen?: boolean;
}): ReactNode {
  // Map AI SDK UI tool-state values to our union.
  const state: ToolProps["state"] = (() => {
    if (part.state === "output-error") return "output-error";
    if (part.state === "output-available") return "output-available";
    if (part.state === "input-streaming") return "input-streaming";
    if (part.state === "input-available") return "input-available";
    return "partial";
  })();
  return (
    <Tool
      defaultOpen={defaultOpen}
      name={part.toolName}
      state={state}
      toolCallId={part.toolCallId}
    >
      <ToolInput input={part.input} />
      {state === "output-available" || state === "output-error" ? (
        <ToolOutput errorText={part.errorText} output={part.output} />
      ) : null}
    </Tool>
  );
}

/** Re-export so callers can wire up their own copy button. */
export const ToolButton = Button;
