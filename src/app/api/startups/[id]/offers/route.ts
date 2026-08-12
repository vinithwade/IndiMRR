import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: startup } = await supabase
    .from("startups")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!startup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("startup_id", id)
    .maybeSingle();
  if (!listing) {
    return NextResponse.json({ offers: [] });
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("*, profiles:buyer_id(full_name), conversations(id)")
    .eq("listing_id", listing.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    offers: (offers ?? []).map((o) => ({
      ...o,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buyer_name: (o as any).profiles?.full_name ?? "Buyer",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversation_id: (o as any).conversations?.id ?? null,
    })),
  });
}
