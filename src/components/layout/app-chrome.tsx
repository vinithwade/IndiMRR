"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthGateProvider } from "@/components/auth/auth-gate";

function useAppShell(pathname: string | null, isLoggedIn: boolean) {
  if (!isLoggedIn || !pathname) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname === "/") return false;
  return true;
}

export function AppChrome({
  demo,
  user,
  children,
}: {
  demo: boolean;
  user: {
    email: string;
    name?: string | null;
    accountRole?: "buyer" | "seller" | null;
  } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthenticated = Boolean(user);
  const shell = useAppShell(pathname, isAuthenticated);

  const body = shell ? (
    <div className="min-h-screen bg-background">
      <AppSidebar
        email={user?.email ?? "demo@verifiedmrr.com"}
        name={user?.name ?? (demo ? "Demo Founder" : null)}
        accountRole={user?.accountRole ?? null}
      />
      <div className="min-h-screen lg:pl-[260px]">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  ) : (
    <>
      <SiteHeaderClient demo={demo} user={user} forceMarketing />
      <main className="flex-1">{children}</main>
      <SiteFooter forceShow />
    </>
  );

  return (
    <AuthGateProvider isAuthenticated={isAuthenticated}>{body}</AuthGateProvider>
  );
}
