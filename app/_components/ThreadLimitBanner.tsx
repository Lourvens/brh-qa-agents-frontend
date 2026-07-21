import { MessageSquarePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { MAX_MESSAGES_PER_THREAD } from "../_lib/thread-config";

/**
 * Sticky banner shown when the conversation hits the per-thread
 * message cap. Renders above the composer so the user can't miss
 * it: the composer is also disabled while this banner is up.
 *
 * Resetting hands control back to the page; we just clear the
 * `useChat` messages array via `setMessages([])`.
 */
export function ThreadLimitBanner({
  messageCount,
  onReset,
}: {
  messageCount: number;
  onReset: () => void;
}) {
  return (
    <div
      aria-live="polite"
      className="border-amber-500/30 border-t bg-amber-500/10"
      role="status"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-amber-900 text-sm dark:text-amber-200">
            Limite de conversation atteinte
          </p>
          <p className="mt-0.5 text-amber-900/80 text-xs dark:text-amber-200/80">
            Cette conversation contient {messageCount} messages
            {messageCount === MAX_MESSAGES_PER_THREAD ? " — " : " sur "}
            {MAX_MESSAGES_PER_THREAD} maximum. Démarrez une nouvelle
            conversation pour continuer à interroger l&apos;agent.
          </p>
        </div>
        <Button
          className="h-8"
          onClick={onReset}
          size="sm"
          type="button"
          variant="outline"
        >
          <MessageSquarePlusIcon
            aria-hidden
            className="mr-1.5 size-3.5"
          />
          Nouvelle conversation
        </Button>
      </div>
    </div>
  );
}