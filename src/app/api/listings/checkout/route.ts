import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getRazorpay } from "@/lib/razorpay/client";
import { LISTING_FEE_INR, LISTING_FEE_USD } from "@/lib/constants";

const schema = z.object({
  startupId: z.string().uuid(),
  provider: z.enum(["stripe", "razorpay"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", body.startupId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!startup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  if (body.provider === "stripe") {
    const amount = LISTING_FEE_USD * 100;
    const { data: tx, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        startup_id: startup.id,
        kind: "listing_fee",
        provider: "stripe",
        amount_cents: amount,
        currency: "USD",
        status: "pending",
      })
      .select("*")
      .single();
    if (error || !tx) {
      return NextResponse.json({ error: error?.message }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/dashboard/startups/${startup.id}?listing=success`,
      cancel_url: `${origin}/dashboard/startups/${startup.id}?listing=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: "VerifiedMRR Starter listing",
              description: `Marketplace upgrade for ${startup.name}`,
            },
          },
        },
      ],
      metadata: {
        type: "listing_fee",
        startupId: startup.id,
        transactionId: tx.id,
        userId: user.id,
      },
    });

    await supabase
      .from("transactions")
      .update({ provider_payment_id: session.id })
      .eq("id", tx.id);

    return NextResponse.json({ checkoutUrl: session.url, transactionId: tx.id });
  }

  const amount = LISTING_FEE_INR * 100;
  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      startup_id: startup.id,
      kind: "listing_fee",
      provider: "razorpay",
      amount_cents: amount,
      currency: "INR",
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !tx) {
    return NextResponse.json({ error: error?.message }, { status: 400 });
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `list_${tx.id.slice(0, 8)}`,
    notes: {
      type: "listing_fee",
      startupId: startup.id,
      transactionId: tx.id,
    },
  });

  await supabase
    .from("transactions")
    .update({ provider_payment_id: order.id })
    .eq("id", tx.id);

  return NextResponse.json({
    transactionId: tx.id,
    razorpay: {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    },
  });
}
