import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      offer_id,
      listing_id,
      startup_id,
      buyer_id,
      seller_id,
      last_message_at,
      created_at,
      startups(name, slug),
      offers(amount_cents, currency, status, message),
      buyer:profiles!buyer_id(id, full_name),
      seller:profiles!seller_id(id, full_name)
    `
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const conversations = (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const isBuyer = r.buyer_id === user.id;
    const counterpart = isBuyer ? r.seller : r.buyer;
    return {
      id: r.id,
      offerId: r.offer_id,
      startupId: r.startup_id,
      startupName: r.startups?.name ?? "Startup",
      startupSlug: r.startups?.slug ?? "",
      amountCents: r.offers?.amount_cents ?? 0,
      currency: r.offers?.currency ?? "USD",
      offerStatus: r.offers?.status ?? "pending",
      counterpartName: counterpart?.full_name ?? (isBuyer ? "Seller" : "Buyer"),
      role: isBuyer ? "buyer" : "seller",
      lastMessageAt: r.last_message_at,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json({ conversations });
}
