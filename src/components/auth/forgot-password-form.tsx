"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiClientError } from "@/lib/api/client";

/** Request a password-reset email. */
export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset", { method: "POST", json: { email } });
      setSent(true);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="text-base font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
          link to reset your password. It expires shortly, so use it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
