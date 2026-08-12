import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** Auth gate only — chrome/sidebar comes from AppChrome when logged in. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDemoMode()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?next=/dashboard");
  }

  return children;
}
