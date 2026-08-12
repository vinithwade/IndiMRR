import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/supabase/config";
import { getAuthUser } from "@/lib/supabase/auth";

/** Auth gate only — chrome/sidebar comes from AppChrome when logged in. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDemoMode()) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login?next=/dashboard");
  }

  return children;
}
