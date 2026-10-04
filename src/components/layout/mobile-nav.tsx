"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, MessagesSquare, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/site";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  MessagesSquare,
  ListChecks,
  TrendingUp,
  User,
};

/**
 * Bottom navigation for phones — the primary audience is students on mobile.
 * Fixed to the safe area and hidden from tablet width up.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {mobileNav.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-foreground")} />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
