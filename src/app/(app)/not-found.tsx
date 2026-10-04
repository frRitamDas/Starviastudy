import Link from "next/link";
import { PageContainer } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** App-wide not-found page, shown inside the authenticated shell. */
export default function AppNotFound() {
  return (
    <PageContainer width="default">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-mono text-xs text-muted-foreground">404</p>
          <h1 className="text-xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            The page you were looking for doesn&apos;t exist, or you don&apos;t have access to it.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tutor">Ask the tutor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
