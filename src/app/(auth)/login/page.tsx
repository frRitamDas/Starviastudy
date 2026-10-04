import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Starvia and continue studying with your AI tutor.",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Log in to pick up where you left off.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Starvia?{" "}
        <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
