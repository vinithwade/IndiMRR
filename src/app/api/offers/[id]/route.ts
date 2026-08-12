import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["accepted", "rejected", "withdrawn"]),
});

export async function PATCH(
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

  const body = schema.parse(await request.json());

  const { data: offer } = await supabase
    .from("offers")
    .select(
      "*, listings(startup_id, startups(owner_id, name)), conversations(id)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startup = (offer as any).listings?.startups;
  const ownerId = startup?.owner_id as string | undefined;
  const startupName = (startup?.name as string | undefined) ?? "your startup";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationId = (offer as any).conversations?.id as string | undefined;
  const isBuyer = offer.buyer_id === user.id;
  const isSeller = ownerId === user.id;

  if (body.status === "withdrawn" && !isBuyer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let proposedBy: "buyer" | "seller" = "buyer";
  if (
    (body.status === "accepted" || body.status === "rejected") &&
    conversationId
  ) {
    const admin = createServiceClient();
    const { data: latestOfferMsg } = await admin
      .from("messages")
      .select("meta, sender_id")
      .eq("conversation_id", conversationId)
      .eq("kind", "offer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const meta =
      latestOfferMsg?.meta &&
      typeof latestOfferMsg.meta === "object" &&
      !Array.isArray(latestOfferMsg.meta)
        ? (latestOfferMsg.meta as Record<string, unknown>)
        : {};

    if (meta.proposedBy === "seller" || meta.proposedBy === "buyer") {
      proposedBy = meta.proposedBy;
    } else if (latestOfferMsg?.sender_id === ownerId) {
      proposedBy = "seller";
    } else {
      proposedBy = "buyer";
    }
  }

  if (body.status === "accepted" || body.status === "rejected") {
    const canDecide =
      (proposedBy === "buyer" && isSeller) ||
      (proposedBy === "seller" && isBuyer);
    if (!canDecide) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (
    (body.status === "accepted" || body.status === "rejected") &&
    offer.status !== "pending"
  ) {
    return NextResponse.json(
      { error: "Only pending offers can be accepted or rejected" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("offers")
    .update({ status: body.status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const href = conversationId
    ? `/dashboard/messages/${conversationId}`
    : "/dashboard/offers";

  if (
    conversationId &&
    (body.status === "accepted" || body.status === "rejected")
  ) {
    try {
      const admin = createServiceClient();
      const amountLabel = `${(offer.amount_cents / 100).toLocaleString()} ${offer.currency}`;
      const updateBody =
        body.status === "accepted"
          ? `Offer accepted — ${amountLabel}`
          : `Offer rejected — ${amountLabel}`;

      // Mark prior offer cards in this thread
      const { data: offerMessages } = await admin
        .from("messages")
        .select("id, meta")
        .eq("conversation_id", conversationId)
        .eq("kind", "offer");

      for (const row of offerMessages ?? []) {
        const meta =
          row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
            ? { ...(row.meta as Record<string, unknown>) }
            : {};
        if (meta.offerId === id || !meta.offerId) {
          await admin
            .from("messages")
            .update({
              meta: { ...meta, offerId: id, status: body.status },
            })
            .eq("id", row.id);
        }
      }

      await admin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: updateBody,
        kind: "offer_update",
        meta: {
          offerId: id,
          status: body.status,
          amountCents: offer.amount_cents,
          currency: offer.currency,
        },
      });
    } catch (err) {
      console.error("offer status message", err);
    }
  }

  if (body.status === "accepted" || body.status === "rejected") {
    const notifyUserId =
      proposedBy === "seller" ? (ownerId as string) : offer.buyer_id;
    await createNotification({
      userId: notifyUserId,
      kind: "offer_update",
      title:
        body.status === "accepted"
          ? `Offer accepted — ${startupName}`
          : `Offer declined — ${startupName}`,
      body:
        body.status === "accepted"
          ? "Your offer was accepted. Continue the conversation to close."
          : "Your offer was declined. You can send another counter offer in chat.",
      href,
      meta: { offerId: id, status: body.status, conversationId },
    });
  }

  if (body.status === "withdrawn" && ownerId) {
    await createNotification({
      userId: ownerId,
      kind: "offer_update",
      title: `Offer withdrawn — ${startupName}`,
      body: "A buyer withdrew their offer.",
      href,
      meta: { offerId: id, status: body.status, conversationId },
    });
  }

  return NextResponse.json({ ok: true, status: body.status });
}
