"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/currency/money";
import { isDemoMode } from "@/lib/supabase/config";

type OfferRow = {
  id: string;
  amount_cents: number;
  currency: string;
  message: string | null;
  status: string;
  created_at: string;
  buyer_name?: string;
};

export function SellerOffers({
  startupId,
  demo,
}: {
  startupId: string;
  demo?: boolean;
}) {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demo || isDemoMode()) {
      setOffers([
        {
          id: "demo-offer",
          amount_cents: 15000000,
          currency: "USD",
          message: "Ready to close in 2 weeks with Escrow.com.",
          status: "deposited",
          created_at: new Date().toISOString(),
          buyer_name: "Alex Buyer",
        },
      ]);
      setLoading(false);
      return;
    }
    fetch(`/api/startups/${startupId}/offers`)
      .then((r) => r.json())
      .then((d) => setOffers(d.offers ?? []))
      .finally(() => setLoading(false));
  }, [startupId, demo]);

  async function respond(offerId: string, action: "accepted" | "rejected") {
    if (demo || isDemoMode()) {
      toast.success(`Demo: offer ${action}`);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: action } : o))
      );
      return;
    }
    const res = await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    toast.success(`Offer ${action}`);
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: action } : o))
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Incoming offers</h2>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && offers.length === 0 && (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      )}
      {offers.map((o) => (
        <div key={o.id} className="border border-border/80 bg-card/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="mt-0 text-base font-medium">
              <Money cents={o.amount_cents} from={o.currency} />
            </p>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {o.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {o.buyer_name ?? "Buyer"} · {o.message || "No message"}
          </p>
          {o.status === "deposited" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => respond(o.id, "accepted")}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => respond(o.id, "rejected")}
              >
                Reject
              </Button>
            </div>
          )}
          {o.status === "accepted" && (
            <div className="mt-3 border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
              Closing checklist: transfer repo access, domain, Stripe account,
              customer data, and documentation. Prefer Escrow.com or counsel for
              the remaining balance.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
