import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";

const DEMO = [
  {
    id: "demo-1",
    kind: "platform",
    title: "Welcome to VerifiedMRR",
    body: "Browse verified startups, send free offers, and chat with sellers.",
    href: "/marketplace",
    read_at: null,
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "demo-2",
    kind: "offer",
    title: "New offer on InboxPilot",
    body: "Alex Buyer offered $150,000 and started a chat.",
    href: "/dashboard/messages/demo",
    read_at: null,
    created_at: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "demo-3",
    kind: "message",
    title: "New message",
    body: "Thanks for the offer. Happy to share diligence docs this week.",
    href: "/dashboard/messages/demo",
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400_000).toISOString(),
  },
];

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      notifications: DEMO,
      unreadCount: DEMO.filter((n) => !n.read_at).length,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data, error }, unreadRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, kind, title, body, href, read_at, created_at, meta")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    notifications: data ?? [],
    unreadCount: unreadRes.count ?? 0,
  });
}

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchSchema.parse(await request.json());
  const now = new Date().toISOString();

  if (body.all) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!body.ids?.length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .in("id", body.ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
