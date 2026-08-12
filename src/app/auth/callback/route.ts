import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role");
  const role =
    roleParam === "buyer" || roleParam === "seller" ? roleParam : null;

  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user && role) {
      await supabase
        .from("profiles")
        .update({ account_role: role })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
