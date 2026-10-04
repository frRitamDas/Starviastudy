import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder. Uses a soft pulse so loading states feel calm rather
 * than busy, and respects prefers-reduced-motion via the global rule.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
