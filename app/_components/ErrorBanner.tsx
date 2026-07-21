import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline error banner for `useChat().error`. Carries one
 * human-readable line + the upstream message + a retry button that
 * calls `regenerate` from the chat hook.
 */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      aria-live="assertive"
      className="border-destructive/30 border-t bg-destructive/10"
      role="alert"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-3 sm:px-6">
        <AlertCircleIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-destructive text-sm">
            La réponse n&apos;a pas pu aboutir.
          </p>
          <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
            {message}
          </p>
        </div>
        <Button
          className="h-8"
          onClick={onRetry}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCwIcon aria-hidden className="mr-1.5 size-3.5" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
