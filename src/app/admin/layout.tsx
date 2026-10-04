import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/env";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Admin shell. Middleware already blocks non-admins, but this layout checks
 * again server-side so the route can never render for a normal user.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Admin
            </span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
