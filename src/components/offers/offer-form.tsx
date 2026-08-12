"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateDepositCents,
  calculatePlatformFeeCents,
} from "@/lib/mrr/calc";
import { Money } from "@/components/currency/money";
import { isDemoMode } from "@/lib/supabase/config";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function OfferForm({
  listingId,
  askingPriceCents,
  currency,
  startupName,
}: {
  listingId: string;
  askingPriceCents: number;
  currency: string;
  startupName: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    askingPriceCents ? String(askingPriceCents / 100) : ""
  );
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<"stripe" | "razorpay">("stripe");
  const [loading, setLoading] = useState(false);

  const amountCents = Math.round(Number(amount || 0) * 100);
  const depositCents = useMemo(
    () => calculateDepositCents(amountCents, currency),
    [amountCents, currency]
  );
  const feeCents = calculatePlatformFeeCents(depositCents);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountCents || amountCents < 10000) {
      toast.error("Offer must be at least $100 (listing currency)");
      return;
    }

    if (isDemoMode()) {
      toast.success(
        `Demo offer submitted on ${startupName}. Connect Supabase + Stripe/Razorpay to take real deposits.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amountCents,
          currency,
          message,
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create offer");

      if (provider === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (provider === "razorpay" && data.razorpay) {
        await loadRazorpay();
        const rzp = new window.Razorpay!({
          key: data.razorpay.keyId,
          amount: data.razorpay.amount,
          currency: data.razorpay.currency,
          name: "VerifiedMRR",
          description: `Earnest deposit for ${startupName}`,
          order_id: data.razorpay.orderId,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await fetch("/api/deposits/razorpay/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                offerId: data.offerId,
                depositId: data.depositId,
                ...response,
              }),
            });
            toast.success("Deposit paid. Seller has been notified.");
            router.push("/dashboard/offers");
          },
        });
        rzp.open();
        return;
      }

      toast.success("Offer created");
      router.push("/dashboard/offers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="offer">Your offer ({currency})</Label>
        <Input
          id="offer"
          type="number"
          min={100}
          step={100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="metric-mono"
          required
        />
        {amountCents > 0 && (
          <p className="text-xs text-muted-foreground">
            Display ≈ <Money cents={amountCents} from={currency} />
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message to seller</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your background and timeline..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Deposit payment</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={provider === "stripe" ? "default" : "outline"}
            onClick={() => setProvider("stripe")}
          >
            Stripe
          </Button>
          <Button
            type="button"
            variant={provider === "razorpay" ? "default" : "outline"}
            onClick={() => setProvider("razorpay")}
          >
            Razorpay
          </Button>
        </div>
      </div>
      <div className="border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <p>
          Earnest deposit:{" "}
          <Money cents={depositCents} from={currency} className="text-foreground" />{" "}
          (5%, min/max applied)
        </p>
        <p className="mt-1">
          Platform fee (10% of deposit):{" "}
          <Money cents={feeCents} from={currency} />
        </p>
        <p className="mt-2 text-[10px]">
          Checkout charges in listing currency ({currency}). Header currency only
          changes how amounts are displayed.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing…" : "Submit offer & pay deposit"}
      </Button>
    </form>
  );
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}
