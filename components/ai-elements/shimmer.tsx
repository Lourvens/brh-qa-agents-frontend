"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type ShimmerProps = HTMLAttributes<HTMLSpanElement> & {
  duration?: number;
};

/**
 * Minimal shim for the deleted `shimmer.tsx` bundle file — kept
 * local so Reasoning's default trigger still imports. We render a
 * CSS shimmer via the `animate-pulse` utility instead of pulling
 * in a custom-keyframe shimmer (per UI/UX principles doc §10).
 */
export function Shimmer({ className, children, ...props }: ShimmerProps) {
  return (
    <span
      className={cn("inline-block animate-pulse text-muted-foreground", className)}
      {...props}
    >
      {children}
    </span>
  );
}
