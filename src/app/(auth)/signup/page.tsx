import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free Starvia account and start learning with an AI tutor built for ICSE, CBSE and State Board students.",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Start learning free</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No card needed. Set up your class and board in under a minute.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <SignupForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
