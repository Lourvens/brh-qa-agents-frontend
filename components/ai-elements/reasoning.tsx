"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";
import { Shimmer } from "./shimmer";

/** Cursor-style cap. Long traces scroll inside; the message stays short. */
const REASONING_MAX_HEIGHT = 320;

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;
const COLLAPSE_EASE = [0.16, 1, 0.3, 1] as const; // ease-out-expo-ish, snappy

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: undefined,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.ceil((Date.now() - startTime) / MS_IN_S));
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (defaultOpen && !isStreaming && isOpen && !hasAutoClosed) {
        // Add a small delay before closing to allow user to see the content
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);

        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Collapsible
          className={cn(
            "not-prose mb-3 rounded-lg border border-border/60 bg-muted/30",
            className,
          )}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  },
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  /** Render the label/icon area of the trigger. Receives the streaming
   *  state so callers can render their own pulsing-dot / "thinking" copy.
   *  When omitted, falls back to the BrainIcon + localized label. */
  renderLabel?: (state: {
    isStreaming: boolean;
    duration?: number;
    isOpen: boolean;
  }) => ReactNode;
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

function formatDuration(d?: number): string | null {
  if (d === undefined || d === null) return null;
  if (d <= 0) return "quelques secondes";
  if (d === 1) return "1 seconde";
  return `${d} secondes`;
}

/** Default French label — see UIUX-PRINCIPLES.md §7 for the operator-grade
 *  rationale (compact, low chrome). */
const defaultGetThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1}>Réflexion en cours…</Shimmer>;
  }
  const formatted = formatDuration(duration);
  if (formatted) {
    return <span>Raisonné pendant {formatted}</span>;
  }
  return <span>Raisonnement</span>;
};

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    renderLabel,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "group/trigger flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-muted-foreground text-sm transition-colors",
          "hover:bg-muted/60 hover:text-foreground",
          "focus-visible:bg-muted/60 focus-visible:text-foreground",
          className,
        )}
        {...props}
      >
        <span className="flex min-w-0 items-center gap-2">
          {renderLabel ? (
            renderLabel({ isStreaming, duration, isOpen })
          ) : (
            <>
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                  isStreaming
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isStreaming ? (
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                ) : (
                  <BrainIcon className="size-3" />
                )}
              </span>
              <span className="truncate font-medium text-foreground/80">
                {children ?? getThinkingMessage(isStreaming, duration)}
              </span>
            </>
          )}
        </span>

        {/* Chevron rotates 180° on open — driven by framer-motion
            so the rotation matches the content's expand/collapse easing. */}
        <motion.span
          aria-hidden
          className="flex shrink-0 items-center text-muted-foreground"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: COLLAPSE_EASE }}
        >
          <ChevronDownIcon className="size-4" />
        </motion.span>
      </CollapsibleTrigger>
    );
  },
);

export type ReasoningContentProps = ComponentProps<"div"> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children }: ReasoningContentProps) => {
    const { isOpen, isStreaming } = useReasoning();
    // Mount the panel *once* and toggle via framer-motion's `animate`
    // key on `isOpen`. Tearing down + re-creating with AnimatePresence
    // loses the height measurement on the second open (the ResizeObserver
    // is observing the disposed node, so the motion.div renders at 0
    // forever after the first close). Keeping the subtree alive sidesteps
    // the entire mount/unmount dance.
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [height, setHeight] = useState<number>(0);
    // Track whether the user has scrolled the inner panel away from
    // the bottom; auto-scroll then yields to user intent until the
    // panel is closed or the user scrolls back to the bottom.
    const userScrolledRef = useRef(false);

    useEffect(() => {
      const el = outerRef.current;
      if (!el) return;
      const measure = () => {
        // Cap at REASONING_MAX_HEIGHT so the open animation lands
        // on the visible window even if the trace is long; the
        // inner scroll container handles overflow.
        setHeight(Math.min(el.scrollHeight, REASONING_MAX_HEIGHT));
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, [children]);

    // While streaming, follow the tail of the inner scroll container —
    // the same intent Perplexity / Cursor use. After streaming ends
    // the panel freezes at whatever position the user left.
    useEffect(() => {
      if (!isOpen) return;
      // Reset the "user scrolled away" tracker when the panel opens.
      userScrolledRef.current = false;
      const inner = innerRef.current;
      if (!inner) return;
      const follow = () => {
        if (userScrolledRef.current && !isStreaming) return;
        inner.scrollTo({
          top: inner.scrollHeight,
          behavior: "smooth",
        });
      };
      follow();
    }, [children, isOpen, isStreaming]);

    return (
      <motion.div
        ref={outerRef}
        initial={false}
        animate={{
          height: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.28, ease: COLLAPSE_EASE },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        aria-hidden={!isOpen}
        className={cn(
          "overflow-hidden border-border/40 border-t text-muted-foreground",
          className,
        )}
      >
        <div
          ref={innerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const atBottom =
              el.scrollHeight - el.scrollTop - el.clientHeight < 16;
            userScrolledRef.current = !atBottom;
          }}
          className="brh-prose max-h-[var(--brh-reasoning-max-h)] overflow-y-auto px-3 py-2 text-xs leading-5 scroll-smooth"
          style={{
            ["--brh-reasoning-max-h" as string]: `${REASONING_MAX_HEIGHT}px`,
          }}
        >
          <Streamdown>{children}</Streamdown>
        </div>
      </motion.div>
    );
  },
);
