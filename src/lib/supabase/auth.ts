import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";

type ShellAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/** One auth round-trip per request (shared by layout + pages). */
export const getAuthUser = cache(async (): Promise<ShellAuthUser | null> => {
  if (isDemoMode()) {
    return {
      id: "demo",
      email: "demo@verifiedmrr.com",
      user_metadata: { full_name: "Demo Founder" },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Lightweight shell identity — prefers profile name when available. */
export const getShellUser = cache(async () => {
  if (isDemoMode()) {
    return {
      email: "demo@verifiedmrr.com",
      name: "Demo Founder",
      accountRole: "seller" as const,
    };
  }

  const user = await getAuthUser();
  if (!user || user.id === "demo") return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, account_role")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const metaName =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;

  const metaRole =
    meta.account_role === "buyer" || meta.account_role === "seller"
      ? meta.account_role
      : null;

  return {
    email: user.email ?? user.id,
    name: profile?.full_name || metaName,
    accountRole:
      profile?.account_role === "buyer" || profile?.account_role === "seller"
        ? profile.account_role
        : metaRole,
  };
});
