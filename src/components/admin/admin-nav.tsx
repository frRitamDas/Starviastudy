import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="flex items-center gap-1 text-sm">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Users className="h-4 w-4" />
        Overview
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to app
      </Link>
    </nav>
  );
}
