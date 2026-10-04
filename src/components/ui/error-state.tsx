import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Error state — friendly, non-technical, and always recoverable.
 * Raw errors are never surfaced; the caller passes human copy.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If it keeps happening, contact support.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/30 bg-background text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
