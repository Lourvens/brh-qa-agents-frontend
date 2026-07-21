import {
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { BookOpenIcon, SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BRHHeroIcon } from "@/components/brh-hero-icon";

/**
 * Welcome state — BRH hero mark + copy + suggestion chips.
 * Clicking a chip calls `onPick`, which the parent forwards to
 * `sendMessage`.
 */
export function EmptyConversation({
  onPick,
  suggestionChips,
}: {
  onPick: (text: string) => void;
  suggestionChips: readonly string[];
}) {
  return (
    <ConversationEmptyState
      className="mx-auto max-w-xl gap-6 py-16"
      description="Posez une question sur la Revue Développement De Connaissances et Compétences Financières de la BRH. Les réponses citent leurs sources."
      icon={
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <BRHHeroIcon className="size-8" />
        </div>
      }
      title="Assistant RDDCF"
    >
      <EmptyBody
        chips={suggestionChips}
        onPick={onPick}
      />
    </ConversationEmptyState>
  );
}

function EmptyBody({
  chips,
  onPick,
}: {
  chips: readonly string[];
  onPick: (text: string) => void;
}): ReactNode {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <p className="flex items-center justify-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        <SparklesIcon className="size-3" aria-hidden />
        Suggestions
      </p>
      <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {chips.map((s) => (
          <li key={s}>
            <button
              className="group/chip flex w-full items-start gap-2 rounded-lg border border-border/70 bg-card px-4 py-3 text-left text-base text-foreground leading-snug shadow-xs transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow focus-visible:-translate-y-0.5 focus-visible:border-accent"
              onClick={() => onPick(s)}
              type="button"
            >
              <BookOpenIcon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-accent"
              />
              <span className="leading-snug">{s}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
