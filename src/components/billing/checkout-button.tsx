"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useApp } from "@/components/providers/app-provider";
import type { PlanId } from "@/lib/plans";

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

/**
 * Checkout button.
 *
 * Creates the order on the server, opens Razorpay's checkout, then sends the
 * result back to the server for verification. The browser is never trusted to
 * declare success — a forged callback fails signature verification server-side.
 */
export function CheckoutButton({
  plan,
  planName,
  amountLabel,
  keyId,
  live,
}: {
  plan: PlanId;
  planName: string;
  amountLabel: string;
  keyId: string;
  live: boolean;
}) {
  const router = useRouter();
  const { refresh } = useApp();
  const [loading, setLoading] = React.useState(false);

  async function complete(payload: { orderId: string; paymentId: string; signature: string }) {
    const result = await apiFetch<{ activated: boolean; plan: PlanId }>("/api/billing/verify", {
      method: "POST",
      json: { plan, ...payload },
    });
    if (!result.activated) {
      throw new Error("activation_failed");
    }
    await refresh();
    toast.success(`You're on ${planName}. Everything is unlocked.`);
    router.push("/dashboard");
    router.refresh();
  }

  async function start() {
    setLoading(true);
    try {
      const order = await apiFetch<{
        orderId: string;
        amount: number;
        currency: string;
        mode: "live" | "mock";
        keyId: string;
      }>("/api/billing/checkout", { method: "POST", json: { plan } });

      // Mock mode: Razorpay is genuinely unconfigured. The order id was issued
      // by our own server, and verification still happens server-side.
      if (order.mode === "mock") {
        await complete({
          orderId: order.orderId,
          paymentId: `mock_payment_${Date.now()}`,
          signature: "mock",
        });
        return;
      }

      await loadRazorpayScript();
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error("checkout_unavailable");
      }

      const checkout = new Razorpay({
        key: order.keyId || keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Starvia",
        description: `${planName} plan — monthly`,
        order_id: order.orderId,
        theme: { color: "#111111" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await complete({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          } catch {
            toast.error("Payment could not be verified. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      checkout.open();
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
      } else {
        toast.error("Payment could not be completed. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={start} loading={loading}>
      <Lock className="h-4 w-4" />
      {live ? `Pay ${amountLabel} securely` : `Continue (test mode) — ${amountLabel}`}
    </Button>
  );
}

let scriptPromise: Promise<void> | null = null;

/** Load Razorpay's checkout script once, on demand. */
function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("razorpay_script_failed"));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}
