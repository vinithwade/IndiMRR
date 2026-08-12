import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { SiteHeaderClient } from "@/components/layout/site-header-client";

export async function SiteHeader() {
  const demo = isDemoMode();
  let user: { email: string; name?: string | null } | null = null;

  if (!demo) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", authUser.id)
          .maybeSingle();
        user = {
          email: authUser.email ?? authUser.id,
          name: profile?.full_name ?? authUser.user_metadata?.full_name,
        };
      }
    } catch {
      user = null;
    }
  }

  return <SiteHeaderClient demo={demo} user={user} />;
}
