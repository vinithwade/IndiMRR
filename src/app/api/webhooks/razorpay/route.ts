import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { verifyRazorpayWebhook } from "@/lib/razorpay/client";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyRazorpayWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(raw);
  const event = payload.event as string;
  const admin = createServiceClient();

  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    const notes = payment?.notes || {};
    if (notes.type === "deposit" && notes.offerId && notes.depositId) {
      await admin
        .from("deposits")
        .update({
          status: "paid",
          provider_payment_id: payment.id,
          raw_payload: payload,
        })
        .eq("id", notes.depositId);
      await admin
        .from("offers")
        .update({ status: "deposited" })
        .eq("id", notes.offerId);
    }
    if (notes.type === "listing_fee" && notes.startupId && notes.transactionId) {
      await admin
        .from("transactions")
        .update({ status: "paid", provider_payment_id: payment.id })
        .eq("id", notes.transactionId);

      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + 30);
      await admin.from("listings").upsert({
        startup_id: notes.startupId,
        tier: "starter",
        active: true,
        featured_until: featuredUntil.toISOString(),
      });
      await admin
        .from("startups")
        .update({ for_sale: true, status: "published" })
        .eq("id", notes.startupId);
    }
  }

  return NextResponse.json({ received: true });
}
