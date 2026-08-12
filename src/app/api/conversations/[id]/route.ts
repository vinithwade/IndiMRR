import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const postSchema = z.union([
  z.object({
    type: z.literal("offer"),
    amountCents: z.number().int().positive(),
    currency: z.string().min(3).max(3),
  }),
  z.object({
    type: z.literal("text").optional(),
    body: z.string().trim().min(1).max(4000),
  }),
]);

async function getConversationForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string
) {
  const { data } = await supabase
    .from("conversations")
    .select(
      `
      id,
      buyer_id,
      seller_id,
      offer_id,
      startups(name, slug),
      offers(id, amount_cents, currency, status)
    `
    )
    .eq("id", conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle();
  return data;
}

function mapMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  m: any,
  userId: string
) {
  return {
    id: m.id,
    senderId: m.sender_id,
    senderName: m.profiles?.full_name ?? "User",
    body: m.body,
    kind: m.kind ?? "text",
    meta: m.meta ?? {},
    createdAt: m.created_at,
    mine: m.sender_id === userId,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getConversationForUser(supabase, id, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      "id, sender_id, body, kind, meta, created_at, profiles:sender_id(full_name)"
    )
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = conversation as any;
  const isBuyer = c.buyer_id === user.id;

  return NextResponse.json({
    conversation: {
      id: c.id,
      role: isBuyer ? "buyer" : "seller",
      startupName: c.startups?.name ?? "Startup",
      startupSlug: c.startups?.slug ?? "",
      offerId: c.offers?.id ?? c.offer_id,
      amountCents: c.offers?.amount_cents ?? 0,
      currency: c.offers?.currency ?? "USD",
      offerStatus: c.offers?.status ?? "pending",
    },
    messages: (messages ?? []).map((m) => mapMessage(m, user.id)),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getConversationForUser(supabase, id, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = conversation as any;
  const payload = postSchema.parse(await request.json());

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const senderName = senderProfile?.full_name || "Someone";
  const startupName = c.startups?.name ?? "a startup";
  const recipientId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;

  if (payload.type === "offer") {
    const offerId = c.offers?.id ?? c.offer_id;
    if (!offerId) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (c.offers?.status === "withdrawn" || c.offers?.status === "expired") {
      return NextResponse.json(
        { error: "This offer is closed" },
        { status: 400 }
      );
    }

    const proposedBy = c.buyer_id === user.id ? "buyer" : "seller";
    const currency = payload.currency.toUpperCase();
    const { error: offerErr } = await supabase
      .from("offers")
      .update({
        amount_cents: payload.amountCents,
        currency,
        status: "pending",
      })
      .eq("id", offerId);

    if (offerErr) {
      return NextResponse.json({ error: offerErr.message }, { status: 400 });
    }

    const amountLabel = `${(payload.amountCents / 100).toLocaleString()} ${currency}`;
    const body =
      proposedBy === "seller"
        ? `Counter offer: ${amountLabel}`
        : `Offer: ${amountLabel}`;

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        body,
        kind: "offer",
        meta: {
          offerId,
          amountCents: payload.amountCents,
          currency,
          status: "pending",
          proposedBy,
        },
      })
      .select("id, sender_id, body, kind, meta, created_at")
      .single();

    if (error || !message) {
      return NextResponse.json(
        { error: error?.message || "Failed to send offer" },
        { status: 400 }
      );
    }

    await createNotification({
      userId: recipientId,
      kind: "offer",
      title:
        proposedBy === "seller"
          ? `Counter offer · ${startupName}`
          : `New offer · ${startupName}`,
      body: `${senderName} offered ${amountLabel}`,
      href: `/dashboard/messages/${id}`,
      meta: { conversationId: id, offerId, messageId: message.id },
    });

    return NextResponse.json({
      message: mapMessage(
        { ...message, profiles: { full_name: senderName } },
        user.id
      ),
      conversation: {
        offerId,
        amountCents: payload.amountCents,
        currency,
        offerStatus: "pending",
      },
    });
  }

  const textBody =
    "body" in payload ? payload.body : "";
  if (!textBody) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: user.id,
      body: textBody,
      kind: "text",
      meta: {},
    })
    .select("id, sender_id, body, kind, meta, created_at")
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: error?.message || "Failed to send" },
      { status: 400 }
    );
  }

  await createNotification({
    userId: recipientId,
    kind: "message",
    title: `New message · ${startupName}`,
    body: `${senderName}: ${textBody.slice(0, 160)}`,
    href: `/dashboard/messages/${id}`,
    meta: { conversationId: id, messageId: message.id },
  });

  return NextResponse.json({
    message: mapMessage(
      { ...message, profiles: { full_name: senderName } },
      user.id
    ),
  });
}
