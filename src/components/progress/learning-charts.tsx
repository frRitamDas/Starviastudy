import { cn } from "@/lib/utils";

/**
 * Dependency-free charts.
 *
 * Deliberately hand-rolled SVG: a charting library would add hundreds of
 * kilobytes for two simple visualisations. Both components are server-renderable
 * and accessible via an accompanying table caption.
 */

export function BarChart({
  data,
  className,
  height = 160,
}: {
  data: { label: string; value: number }[];
  className?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item) => {
          const percent = (item.value / max) * 100;
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{item.value}</span>
              <div
                className="w-full rounded-t-md bg-foreground/80 transition-[height] duration-500"
                style={{ height: `${Math.max(percent, 2)}%` }}
                role="img"
                aria-label={`${item.label}: ${item.value}`}
              />
              <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LineChart({
  data,
  className,
  height = 160,
}: {
  data: { label: string; value: number }[];
  className?: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        Not enough data yet — complete a couple of quizzes to see your trend.
      </p>
    );
  }

  const width = 600;
  const padding = 8;
  const max = Math.max(...data.map((d) => d.value), 100);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
    return { x, y, ...item };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Score trend over time"
      >
        <path d={area} className="fill-foreground/5" />
        <path
          d={path}
          className="fill-none stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3" className="fill-foreground" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
