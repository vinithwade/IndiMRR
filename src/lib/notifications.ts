import { createServiceClient } from "@/lib/supabase/admin";

export type NotificationKind =
  | "message"
  | "offer"
  | "offer_update"
  | "platform";

const VIEWING_WINDOW_MS = 45_000;

export async function isUserViewingConversation(
  userId: string,
  conversationId: string
) {
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("user_presence")
      .select("active_conversation_id, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data?.active_conversation_id || !data.updated_at) return false;
    if (data.active_conversation_id !== conversationId) return false;

    const age = Date.now() - new Date(data.updated_at).getTime();
    return age >= 0 && age <= VIEWING_WINDOW_MS;
  } catch {
    return false;
  }
}

export async function createNotification(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const conversationId =
      typeof input.meta?.conversationId === "string"
        ? input.meta.conversationId
        : null;

    // WhatsApp-style: no notification if recipient is currently in that chat
    if (
      input.kind === "message" &&
      conversationId &&
      (await isUserViewingConversation(input.userId, conversationId))
    ) {
      return { skipped: true as const };
    }

    const admin = createServiceClient();
    const { error } = await admin.from("notifications").insert({
      user_id: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      meta: input.meta ?? {},
    });
    if (error) {
      console.error("createNotification", error.message);
      return { skipped: false as const, error: error.message };
    }
    return { skipped: false as const };
  } catch (err) {
    console.error("createNotification", err);
    return {
      skipped: false as const,
      error: err instanceof Error ? err.message : "failed",
    };
  }
}

/** Mark message notifications for a conversation as read (user is viewing it). */
export async function markConversationNotificationsRead(
  userId: string,
  conversationId: string
) {
  try {
    const admin = createServiceClient();
    const href = `/dashboard/messages/${conversationId}`;
    await admin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("kind", "message")
      .eq("href", href)
      .is("read_at", null);
  } catch (err) {
    console.error("markConversationNotificationsRead", err);
  }
}
