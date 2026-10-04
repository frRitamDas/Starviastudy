import { cn } from "@/lib/utils";

/** Consistent page container for authenticated screens. */
export function PageContainer({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide" | "full";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8",
        width === "narrow" && "max-w-2xl",
        width === "default" && "max-w-5xl",
        width === "wide" && "max-w-6xl",
        width === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Page title block with an optional action on the right. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground text-pretty">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
