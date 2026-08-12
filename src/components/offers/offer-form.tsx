"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/components/currency/currency-provider";
import {
  convertCents,
  formatConvertedMoney,
} from "@/lib/currency/convert";
import {
  formatGroupedAmount,
  inrScaleLabel,
  parseGroupedAmount,
} from "@/lib/currency/format-amount";
import { isDemoMode } from "@/lib/supabase/config";

export function OfferForm({
  listingId,
  askingPriceCents,
  currency: listingCurrency,
  startupName,
}: {
  listingId: string;
  askingPriceCents: number;
  currency: string;
  startupName: string;
}) {
  const router = useRouter();
  const { currency: displayCurrency, rates } = useCurrency();
  const [amountMajor, setAmountMajor] = useState(0);
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (touched || !askingPriceCents) return;
    const inDisplay = convertCents(
      askingPriceCents,
      listingCurrency,
      displayCurrency,
      rates
    );
    setAmountMajor(Math.round(inDisplay / 100));
  }, [askingPriceCents, listingCurrency, displayCurrency, rates, touched]);

  const amountDisplay = useMemo(
    () => (amountMajor > 0 ? formatGroupedAmount(amountMajor, displayCurrency) : ""),
    [amountMajor, displayCurrency]
  );

  const amountCents = Math.round(amountMajor * 100);

  const usdEquivalent = useMemo(() => {
    if (!amountCents) return null;
    return convertCents(amountCents, displayCurrency, "USD", rates);
  }, [amountCents, displayCurrency, rates]);

  const usdLabel = useMemo(() => {
    if (!amountCents) return null;
    return formatConvertedMoney(amountCents, displayCurrency, "USD", rates);
  }, [amountCents, displayCurrency, rates]);

  const scaleHint =
    displayCurrency === "INR" ? inrScaleLabel(amountMajor) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountCents || !usdEquivalent || usdEquivalent < 10000) {
      toast.error("Offer must be at least about $100 USD");
      return;
    }

    if (isDemoMode()) {
      toast.success(
        `Demo offer sent to ${startupName}. Connect Supabase to message sellers for real.`
      );
      router.push("/dashboard/messages");
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
          currency: displayCurrency,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create offer");

      toast.success("Offer sent — you can keep chatting with the seller.");
      router.push(`/dashboard/messages/${data.conversationId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="offer">Your offer ({displayCurrency})</Label>
        <Input
          id="offer"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={
            displayCurrency === "INR" ? "e.g. 1,00,00,000" : "e.g. 120,000"
          }
          value={amountDisplay}
          onChange={(e) => {
            setTouched(true);
            setAmountMajor(parseGroupedAmount(e.target.value));
          }}
          className="metric-mono"
          required
        />
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {scaleHint && <p>≈ {scaleHint}</p>}
          {amountCents > 0 && displayCurrency !== "USD" && usdLabel && (
            <p>≈ {usdLabel} USD</p>
          )}
          {amountCents > 0 &&
            displayCurrency === "USD" &&
            listingCurrency.toUpperCase() !== "USD" && (
              <p>Listing currency: {listingCurrency.toUpperCase()}</p>
            )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message to seller</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your background and timeline..."
          rows={4}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Free to send — no deposit required. Amounts use{" "}
        {displayCurrency === "INR" ? "Indian" : "local"} grouping so large
        figures are easier to read.
      </p>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send offer"}
      </Button>
    </form>
  );
}
