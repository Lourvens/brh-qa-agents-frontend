"use client";

import { ClockIcon, ShieldAlertIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  formatResetTime,
  type RateLimitInfo,
} from "@/app/_lib/rate-limit";

/**
 * Modal surfaced when the backend returns 429 from ``POST /ask``.
 *
 * Design contract (ADR-0027 + the UX call from the operator):
 *
 *   - Stays open until the user explicitly clicks "Compris". Esc /
 *     outside-click / X button are disabled so the user can't blow
 *     past the limit by accident.
 *   - No live countdown — the modal shows the absolute reset time
 *     so the user knows when to come back without us ticking a
 *     timer in the background.
 *   - Differentiates the per-user cap from the global cap so an
 *     operator can diagnose "you personally hit your quota" vs
 *     "everyone is rate-limited right now".
 *
 * The icon + colour swap on the two scopes makes the difference
 * visible at a glance: a clock for personal quota, a shield for a
 * system-wide limit.
 */
export function RateLimitModal({
  info,
  open,
  onAcknowledge,
}: {
  info: RateLimitInfo | null;
  open: boolean;
  onAcknowledge: () => void;
}) {
  // We render the Dialog even when `info` is null so the
  // close-on-open transition lands cleanly. The content block is
  // gated on `info` so we never show "0 / 0" placeholders.
  const isUser = info?.scope === "user";
  const Icon = isUser ? ClockIcon : ShieldAlertIcon;
  const toneClass = isUser
    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20";

  const title = isUser
    ? "Limite de requêtes atteinte"
    : "Service temporairement limité";
  const description = isUser
    ? `Vous avez atteint la limite de ${info?.limit ?? 50} requêtes par jour.`
    : "Le service a atteint sa limite quotidienne de requêtes.";
  const resetText = info?.resetAt
    ? `Réessayez à partir de ${formatResetTime(info.resetAt)}.`
    : "Réessayez dans quelques heures.";

  return (
    <Dialog
      // Block outside-click dismissal so the only way out is the
      // "Compris" button. The onOpenChange handler below also
      // blocks Esc + close-button paths.
      disablePointerDismissal
      onOpenChange={(next) => {
        // Block every dismissal path except the explicit "Compris"
        // CTA. This keeps the user from accidentally closing the
        // modal and immediately re-triggering a 429.
        if (!next) return;
      }}
      open={open}
    >
      <DialogContent
        aria-describedby="rate-limit-description"
        className="sm:max-w-md"
        showCloseButton={false}
      >
        {info ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ${toneClass}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
              </div>
            </div>

            <DialogDescription id="rate-limit-description">
              <span className="block text-sm">{description}</span>
              <span className="mt-2 block text-sm">{resetText}</span>
            </DialogDescription>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ring-1 ${toneClass}`}
              >
                {isUser ? "Par utilisateur" : "Globale"}
              </span>
              <span aria-hidden>·</span>
              <span>
                Plafond&nbsp;: {info.limit} requêtes / 24&nbsp;h
              </span>
            </div>

            <DialogFooter>
              <Button
                autoFocus
                className="w-full sm:w-auto"
                onClick={onAcknowledge}
                type="button"
              >
                Compris
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
