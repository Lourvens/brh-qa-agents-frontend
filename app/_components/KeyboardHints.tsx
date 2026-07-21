import type { ReactNode } from "react";

/**
 * Tiny inline "kbd" primitive + the standard composer shortcut hints
 * (Cmd/Ctrl+Enter send, Shift+Enter newline, Esc stop).
 */
export function KeyboardHints() {
  return (
    <div className="flex items-center gap-3 text-muted-foreground text-xs">
      <span className="hidden items-center gap-1 sm:inline-flex">
        <Kbd>⌘</Kbd>
        <Kbd>↵</Kbd>
        <span>envoyer</span>
      </span>
      <span className="hidden items-center gap-1 sm:inline-flex">
        <Kbd>Maj</Kbd>
        <Kbd>↵</Kbd>
        <span>nouvelle ligne</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Kbd>Échap</Kbd>
        <span>arrêter</span>
      </span>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border/80 bg-muted px-1 font-mono text-[0.7rem] text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}
