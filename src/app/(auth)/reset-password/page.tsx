import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose a strong password you don&apos;t use anywhere else.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
