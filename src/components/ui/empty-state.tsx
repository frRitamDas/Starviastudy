import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Empty state — shown when there is genuinely nothing to display yet.
 * Always gives the student a next action rather than a dead end.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      ) : null}
      {action ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
          {...(action.href ? { asChild: true } : {})}
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      ) : null}
    </div>
  );
}
