"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Per-message footer actions: copy the assistant's answer to the
 * clipboard and regenerate the same question against the backend
 * (truncating the prior assistant turn before resending).
 *
 * Animation is intentionally minimal — just a subtle scale on
 * hover/press and a 2 s "Copié" check-mark confirmation. Single
 * piece of local state (the copy confirmation flag); no animation
 * libraries, no transitions on the regenerate icon.
 */

type MessageActionsProps = {
  text: string;
  onRetry: () => void;
  disabled?: boolean;
};

const COPY_FEEDBACK_MS = 2000;

export function MessageActions({ text, onRetry, disabled }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch (err) {
      console.warn("[brh.message-actions] clipboard write failed", err);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copier la réponse"
        className="transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        {copied ? (
          <>
            <CheckIcon className="size-4 text-emerald-500 dark:text-emerald-400" />
            <span>Copié</span>
          </>
        ) : (
          <>
            <CopyIcon className="size-4" />
            <span>Copier</span>
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
        aria-label="Régénérer la réponse"
        className="transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:hover:scale-100 disabled:active:scale-100"
      >
        <RotateCcwIcon className="size-4 transition-transform duration-200 group-hover:-rotate-45" />
        <span>Régénérer</span>
      </Button>
    </div>
  );
}
