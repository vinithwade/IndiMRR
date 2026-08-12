import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  calculateDepositCents,
  calculatePlatformFeeCents,
} from "@/lib/mrr/calc";
import { getStripe } from "@/lib/stripe/client";
import { getRazorpay } from "@/lib/razorpay/client";

const schema = z.object({
  listingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  message: z.string().optional(),
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
  const currency = body.currency.toUpperCase();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, startup_id, startups(name, owner_id, for_sale)")
    .eq("id", body.listingId)
    .eq("active", true)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startup = (listing as any).startups;
  if (!startup?.for_sale) {
    return NextResponse.json({ error: "Not for sale" }, { status: 400 });
  }
  if (startup.owner_id === user.id) {
    return NextResponse.json(
      { error: "You cannot offer on your own startup" },
      { status: 400 }
    );
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      listing_id: body.listingId,
      buyer_id: user.id,
      amount_cents: body.amountCents,
      currency,
      message: body.message ?? null,
      status: "pending_deposit",
    })
    .select("*")
    .single();

  if (error || !offer) {
    return NextResponse.json(
      { error: error?.message || "Failed to create offer" },
      { status: 400 }
    );
  }

  const depositCents = calculateDepositCents(body.amountCents, currency);
  const feeCents = calculatePlatformFeeCents(depositCents);
  const origin = new URL(request.url).origin;

  const { data: deposit, error: depErr } = await supabase
    .from("deposits")
    .insert({
      offer_id: offer.id,
      provider: body.provider,
      amount_cents: depositCents,
      currency,
      platform_fee_cents: feeCents,
      status: "pending",
    })
    .select("*")
    .single();

  if (depErr || !deposit) {
    return NextResponse.json(
      { error: depErr?.message || "Failed to create deposit" },
      { status: 400 }
    );
  }

  if (body.provider === "stripe") {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/dashboard/offers?deposit=success`,
      cancel_url: `${origin}/dashboard/offers?deposit=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: depositCents,
            product_data: {
              name: `Earnest deposit — ${startup.name}`,
              description: `Offer ${offer.id}. Platform fee included in terms.`,
            },
          },
        },
      ],
      metadata: {
        type: "deposit",
        offerId: offer.id,
        depositId: deposit.id,
      },
    });

    await supabase
      .from("deposits")
      .update({ provider_payment_id: session.id })
      .eq("id", deposit.id);

    return NextResponse.json({
      offerId: offer.id,
      depositId: deposit.id,
      checkoutUrl: session.url,
    });
  }

  const razorpay = getRazorpay();
  const inrAmount =
    currency === "INR"
      ? depositCents
      : Math.round(depositCents * (Number(process.env.USD_INR_RATE || 83) / 1));
  // Razorpay expects paise for INR
  const order = await razorpay.orders.create({
    amount: currency === "INR" ? depositCents : inrAmount,
    currency: currency === "INR" ? "INR" : "INR",
    receipt: `dep_${deposit.id.slice(0, 8)}`,
    notes: {
      type: "deposit",
      offerId: offer.id,
      depositId: deposit.id,
    },
  });

  await supabase
    .from("deposits")
    .update({ provider_order_id: order.id })
    .eq("id", deposit.id);

  return NextResponse.json({
    offerId: offer.id,
    depositId: deposit.id,
    razorpay: {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    },
  });
}
