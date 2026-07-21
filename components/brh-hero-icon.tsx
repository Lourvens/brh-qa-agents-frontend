/**
 * SVG mark used as the empty-state icon on the chat page. Reads
 * as the BRH initial (stylised "B" rendered as blocks) without
 * shipping the raster logo. Tint via the `text-*` colour class
 * on the consumer.
 */

import type { SVGProps } from "react";

export type BRHHeroIconProps = SVGProps<SVGSVGElement>;

export function BRHHeroIcon(props: BRHHeroIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M14 16h16c6 0 10 4 10 10 0 4-2 7-5 9 4 1 7 5 7 10 0 7-5 11-12 11H14V16zm7 6v11h8c3 0 5-2 5-5.5S32 22 29 22h-8zm0 18v12h9c4 0 6-2 6-6s-2-6-6-6h-9z" />
      <path d="M50 16h6l-7 19 8 22h-7l-5-15h-1l-5 15h-6l8-22-7-19h7l4 14 5-14z" />
    </svg>
  );
}
