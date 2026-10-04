"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [confirmationSent, setConfirmationSent] = React.useState(false);
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/onboarding";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch<{ created: boolean; needsConfirmation: boolean }>(
        "/api/auth/signup",
        { method: "POST", json: { email, password, fullName } },
      );

      // If email confirmation is required we cannot start a session yet.
      if (result.needsConfirmation) {
        setConfirmationSent(true);
        return;
      }

      if (isSupabaseConfigured) {
        const supabase = createClient();
        const { data } = await supabase.auth.signInWithPassword({ email, password });
        if (data.session) {
          toast.success("Account created. Let's set up your profile.");
          router.push(next);
          router.refresh();
          return;
        }
      }

      setConfirmationSent(true);
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="text-base font-semibold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          We&apos;ve sent a confirmation link to <span className="font-medium">{email}</span>. Open
          it to activate your account and start learning.
        </p>
        <Button variant="outline" className="mt-5 w-full" onClick={() => setConfirmationSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div>
      <GoogleAuthButton next="/onboarding" />

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ananya Sharma"
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
