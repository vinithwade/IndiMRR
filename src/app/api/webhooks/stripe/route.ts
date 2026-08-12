import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing webhook config" }, { status: 400 });
  }

  const raw = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata || {};
    const admin = createServiceClient();

    if (meta.type === "deposit" && meta.offerId && meta.depositId) {
      await admin
        .from("deposits")
        .update({
          status: "paid",
          provider_payment_id: session.payment_intent as string,
          raw_payload: session as unknown as Record<string, unknown>,
        })
        .eq("id", meta.depositId);

      const { data: offer } = await admin
        .from("offers")
        .update({ status: "deposited" })
        .eq("id", meta.offerId)
        .select("buyer_id")
        .maybeSingle();

      if (offer?.buyer_id) {
        const { data: deposit } = await admin
          .from("deposits")
          .select("platform_fee_cents, currency")
          .eq("id", meta.depositId)
          .maybeSingle();

        await admin.from("transactions").insert({
          user_id: offer.buyer_id,
          startup_id: null,
          kind: "deposit_fee",
          provider: "stripe",
          amount_cents: deposit?.platform_fee_cents ?? 0,
          currency: deposit?.currency ?? "USD",
          provider_payment_id: session.id,
          status: "paid",
          metadata: { offerId: meta.offerId, depositId: meta.depositId },
        });
      }
    }

    if (meta.type === "listing_fee" && meta.startupId && meta.transactionId) {
      await admin
        .from("transactions")
        .update({
          status: "paid",
          provider_payment_id: session.payment_intent as string,
        })
        .eq("id", meta.transactionId);

      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);

      await admin.from("listings").upsert({
        startup_id: meta.startupId,
        tier: "starter",
        active: true,
        featured_until: featuredUntil.toISOString(),
        listed_at: new Date().toISOString(),
      });

      await admin
        .from("startups")
        .update({ for_sale: true, status: "published" })
        .eq("id", meta.startupId);
    }
  }

  return NextResponse.json({ received: true });
}
