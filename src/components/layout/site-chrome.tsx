import { isDemoMode } from "@/lib/supabase/config";
import { getShellUser } from "@/lib/supabase/auth";
import { AppChrome } from "@/components/layout/app-chrome";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  let user: { email: string; name?: string | null } | null = null;

  try {
    user = await getShellUser();
  } catch {
    user = null;
  }

  return (
    <AppChrome demo={demo} user={user}>
      {children}
    </AppChrome>
  );
}
