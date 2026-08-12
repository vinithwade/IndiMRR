import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay/client";

const schema = z.object({
  offerId: z.string().uuid(),
  depositId: z.string().uuid(),
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
  const valid = verifyRazorpaySignature(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createServiceClient();
  await admin
    .from("deposits")
    .update({
      status: "paid",
      provider_payment_id: body.razorpay_payment_id,
      provider_order_id: body.razorpay_order_id,
      raw_payload: body,
    })
    .eq("id", body.depositId);

  await admin
    .from("offers")
    .update({ status: "deposited" })
    .eq("id", body.offerId)
    .eq("buyer_id", user.id);

  return NextResponse.json({ ok: true });
}
