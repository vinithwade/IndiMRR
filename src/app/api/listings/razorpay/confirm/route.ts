import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay/client";

const schema = z.object({
  startupId: z.string().uuid(),
  transactionId: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
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
  if (
    !verifyRazorpaySignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createServiceClient();
  await admin
    .from("transactions")
    .update({
      status: "paid",
      provider_payment_id: body.razorpay_payment_id,
    })
    .eq("id", body.transactionId)
    .eq("user_id", user.id);

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 30);

  await admin.from("listings").upsert({
    startup_id: body.startupId,
    tier: "starter",
    active: true,
    featured_until: featuredUntil.toISOString(),
    listed_at: new Date().toISOString(),
  });

  await admin
    .from("startups")
    .update({ for_sale: true, status: "published" })
    .eq("id", body.startupId)
    .eq("owner_id", user.id);

  return NextResponse.json({ ok: true });
}
