import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";
import { markConversationNotificationsRead } from "@/lib/notifications";

const schema = z.object({
  conversationId: z.string().uuid().nullable(),
});

export async function POST(request: Request) {
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

  const body = schema.parse(await request.json());
  const conversationId = body.conversationId;

  if (conversationId) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .maybeSingle();

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const { error } = await supabase.from("user_presence").upsert(
    {
      user_id: user.id,
      active_conversation_id: conversationId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (conversationId) {
    await markConversationNotificationsRead(user.id, conversationId);
  }

  return NextResponse.json({ ok: true });
}
