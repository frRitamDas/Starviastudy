"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal-on-scroll wrapper.
 *
 * Uses IntersectionObserver once per element and disconnects immediately, so
 * there is no scroll listener and no layout thrash. Falls back to visible when
 * the API is unavailable (SSR/older browsers) and honours reduced motion via CSS.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(visible ? "animate-fade-up" : "opacity-0", className)}
    >
      {children}
    </Tag>
  );
}
