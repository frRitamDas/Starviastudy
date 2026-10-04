import { cn } from "@/lib/utils";
import { getPlan, type PlanId } from "@/lib/plans";

/** Small plan indicator used in the sidebar, topbar and profile. */
export function PlanBadge({ plan, className }: { plan: PlanId; className?: string }) {
  const definition = getPlan(plan);
  const variant = plan === "free" ? "muted" : plan === "pro" ? "default" : "success";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variant === "muted" && "bg-muted text-muted-foreground",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "success" && "bg-success/15 text-success",
        className,
      )}
    >
      {definition.name}
    </span>
  );
}
