"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { toast } from "sonner";

/**
 * Google OAuth button.
 *
 * Hidden entirely when Supabase is not configured, so a half-configured
 * deployment never shows a button that cannot work.
 */
export function GoogleAuthButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = React.useState(false);

  if (!isSupabaseConfigured) return null;

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        toast.error("Google sign-in is not available right now.");
        setLoading(false);
      }
    } catch {
      toast.error("Google sign-in is not available right now.");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        loading={loading}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.67 4.1-5.35 4.1a5.9 5.9 0 0 1 0-11.8c1.7 0 2.85.72 3.5 1.34l2.4-2.3C16.4 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.6-.06-1.05-.15-1.5z"
      />
    </svg>
  );
}
