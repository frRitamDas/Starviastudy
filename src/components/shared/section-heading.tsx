import { cn } from "@/lib/utils";

/**
 * Section heading used across marketing and app pages.
 * Keeps eyebrow / title / description typography consistent.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
