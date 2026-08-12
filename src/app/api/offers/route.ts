import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  listingId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().default("USD"),
  message: z.string().max(4000).optional(),
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
  const note = body.message?.trim() || null;

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
      message: note,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !offer) {
    return NextResponse.json(
      { error: error?.message || "Failed to create offer" },
      { status: 400 }
    );
  }

  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .insert({
      offer_id: offer.id,
      listing_id: body.listingId,
      startup_id: listing.startup_id,
      buyer_id: user.id,
      seller_id: startup.owner_id,
    })
    .select("*")
    .single();

  if (convErr || !conversation) {
    return NextResponse.json(
      { error: convErr?.message || "Failed to start conversation" },
      { status: 400 }
    );
  }

  const amountLabel = `${(body.amountCents / 100).toLocaleString()} ${currency}`;
  const opener =
    note ||
    `Hi — I submitted an offer of ${amountLabel}. Looking forward to chatting.`;

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body: opener,
    kind: "offer",
    meta: {
      offerId: offer.id,
      amountCents: body.amountCents,
      currency,
      status: "pending",
    },
  });

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const buyerName = buyerProfile?.full_name || "A buyer";

  await createNotification({
    userId: startup.owner_id,
    kind: "offer",
    title: `New offer on ${startup.name}`,
    body: `${buyerName} offered ${amountLabel}${note ? ` — “${note.slice(0, 120)}”` : "."}`,
    href: `/dashboard/messages/${conversation.id}`,
    meta: { offerId: offer.id, conversationId: conversation.id },
  });

  return NextResponse.json({
    offerId: offer.id,
    conversationId: conversation.id,
  });
}
