import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Root not-found page, shown for public URLs that don't exist. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-grid px-4 text-center">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        This page doesn&apos;t exist
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground text-pretty">
        The link may be broken or the page may have moved. Head back home and pick up where you left
        off.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
