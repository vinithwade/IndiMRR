import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
    .select("*, listings(startup_id, startups(owner_id))")
    .eq("id", id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (offer as any).listings?.startups?.owner_id;
  const isBuyer = offer.buyer_id === user.id;
  const isSeller = ownerId === user.id;

  if (body.status === "withdrawn" && !isBuyer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (
    (body.status === "accepted" || body.status === "rejected") &&
    !isSeller
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (
    (body.status === "accepted" || body.status === "rejected") &&
    offer.status !== "deposited"
  ) {
    return NextResponse.json(
      { error: "Offer must have a paid deposit first" },
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

  return NextResponse.json({ ok: true });
}
