"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/supabase/config";
import { LISTING_FEE_INR, LISTING_FEE_USD } from "@/lib/constants";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function ListingUpgrade({
  startupId,
  currentTier,
}: {
  startupId: string;
  currentTier: "free" | "starter" | null;
}) {
  const [loading, setLoading] = useState(false);

  async function upgrade(provider: "stripe" | "razorpay") {
    if (isDemoMode()) {
      toast.success(
        `Demo: would charge $${LISTING_FEE_USD} / ₹${LISTING_FEE_INR} for Starter listing via ${provider}`
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/listings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (provider === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (provider === "razorpay" && data.razorpay) {
        await new Promise<void>((resolve, reject) => {
          if (window.Razorpay) return resolve();
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Razorpay load failed"));
          document.body.appendChild(s);
        });
        const rzp = new window.Razorpay!({
          key: data.razorpay.keyId,
          amount: data.razorpay.amount,
          currency: data.razorpay.currency,
          name: "VerifiedMRR",
          description: "Starter marketplace listing",
          order_id: data.razorpay.orderId,
          handler: async (response: Record<string, string>) => {
            await fetch("/api/listings/razorpay/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startupId,
                transactionId: data.transactionId,
                ...response,
              }),
            });
            toast.success("Listing upgraded to Starter");
            window.location.reload();
          },
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setLoading(false);
    }
  }

  if (currentTier === "starter") {
    return (
      <p className="text-sm text-primary">Starter listing active — featured placement unlocked.</p>
    );
  }

  return (
    <div className="space-y-3 border border-border/80 p-4">
      <div>
        <p className="font-medium">Upgrade to Starter listing</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ${LISTING_FEE_USD} or ₹{LISTING_FEE_INR} — marketplace placement + featured eligibility.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading} onClick={() => upgrade("stripe")}>
          Pay with Stripe
        </Button>
        <Button
          disabled={loading}
          variant="outline"
          onClick={() => upgrade("razorpay")}
        >
          Pay with Razorpay
        </Button>
      </div>
    </div>
  );
}
