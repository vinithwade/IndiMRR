import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim() ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ role: null });
  }

  if (isDemoMode()) {
    return NextResponse.json({ role: null });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_account_role", {
    p_email: email,
  });

  if (error) {
    return NextResponse.json({ role: null });
  }

  const role = data === "buyer" || data === "seller" ? data : null;
  return NextResponse.json({ role });
}
