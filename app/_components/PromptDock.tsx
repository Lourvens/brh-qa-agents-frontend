import {
  ArrowUpIcon,
  SquareIcon,
} from "lucide-react";
import type { ChatStatus } from "ai";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

import { KeyboardHints } from "./KeyboardHints";
import { PLACEHOLDER_PROMPTS } from "../_lib/prompts";

/**
 * Composer dock. Wraps the AI Elements `PromptInput` form, owns the
 * placeholder rotation (client-only, hydrate-stable), and morphs
 * the trailing Send button into a destructive Stop button while the
 * stream is in flight.
 */
export function PromptDock({
  status,
  onSubmit,
  onStop,
  limitReached = false,
}: {
  status: ChatStatus;
  onSubmit: (text: string) => void;
  onStop: () => void;
  limitReached?: boolean;
}) {
  const disabled =
    limitReached || status === "submitted" || status === "streaming";

  // SSR-stable placeholder (matches both server and first client render).
  // After mount we rotate through the list so the user sees varied copy
  // over time, without triggering a hydration mismatch on `Date.now()`.
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_PROMPTS[0]);
  useEffect(() => {
    const i = Math.floor((Date.now() / 8000) % PLACEHOLDER_PROMPTS.length);
    setPlaceholder(PLACEHOLDER_PROMPTS[i]);
  }, []);

  return (
    <div className="border-border/60 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
        <PromptInput onSubmit={(m) => onSubmit(m.text)}>
          <PromptInputBody>
            <PromptInputTextarea
              autoFocus
              className="min-h-14 text-base"
              disabled={disabled}
              placeholder={placeholder}
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-between gap-2">
            <KeyboardHints />
            {disabled ? (
              <Button
                aria-label="Arrêter la génération"
                className="h-9 rounded-full bg-destructive-strong px-4 text-destructive-foreground hover:bg-destructive-strong/90"
                onClick={onStop}
                size="sm"
                type="button"
              >
                <SquareIcon
                  aria-hidden
                  className="mr-1.5 size-3.5 fill-current"
                />
                Arrêter
              </Button>
            ) : (
              <PromptInputSubmit
                className="h-9 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                size="sm"
                status={status}
              >
                <ArrowUpIcon aria-hidden className="size-4" />
                <span className="ml-1">Envoyer</span>
              </PromptInputSubmit>
            )}
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
