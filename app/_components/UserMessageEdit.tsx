"use client";

import { useState } from "react";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Inline edit affordance for the most recent user question. Renders a
 * small "Réécrire" button by default; on click swaps the surrounding
 * text for a textarea with Save / Cancel. Saving truncates the
 * conversation from the user message onwards and re-issues the new
 * text via ``sendMessage``; cancelling reverts.
 *
 * Parent decides visibility — this component is only rendered when
 * the message is the last user message AND no stream is active.
 */

type UserMessageEditProps = {
  text: string;
  onSave: (newText: string) => void;
  disabled?: boolean;
};

const TEXTAREA_CLASSES =
  "flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function UserMessageEdit({ text, onSave, disabled }: UserMessageEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  const startEdit = () => {
    setDraft(text);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(text);
    setEditing(false);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === text) {
      setEditing(false);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={startEdit}
        disabled={disabled}
        aria-label="Réécrire votre message"
        className="mt-2 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        <PencilIcon className="size-4" />
        <span>Réécrire</span>
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        disabled={disabled}
        autoFocus
        rows={3}
        className={TEXTAREA_CLASSES}
        aria-label="Modifier votre message"
      />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={disabled}
          aria-label="Enregistrer la modification"
          className="transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
        >
          <CheckIcon className="size-4" />
          <span>Enregistrer</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancel}
          disabled={disabled}
          aria-label="Annuler la modification"
          className="transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
        >
          <XIcon className="size-4" />
          <span>Annuler</span>
        </Button>
      </div>
    </div>
  );
}
