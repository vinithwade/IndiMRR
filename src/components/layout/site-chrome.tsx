import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { AppChrome } from "@/components/layout/app-chrome";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  let user: { email: string; name?: string | null } | null = null;

  if (demo) {
    user = { email: "demo@verifiedmrr.com", name: "Demo Founder" };
  } else {
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

  return (
    <AppChrome demo={demo} user={user}>
      {children}
    </AppChrome>
  );
}
