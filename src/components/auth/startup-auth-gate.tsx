"use client";

import { useEffect } from "react";
import { useAuthGate } from "@/components/auth/auth-gate";

/** Opens the login popup when a guest hits a startup detail URL directly. */
export function StartupAuthGate({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, openAuthGate } = useAuthGate();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthGate(`/startup/${slug}`);
    }
  }, [isAuthenticated, openAuthGate, slug]);

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center bg-background/40 pt-24">
        <div className="max-w-sm border border-border/80 bg-card/90 p-6 text-center backdrop-blur">
          <p className="text-lg font-semibold tracking-tight">
            Account required
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in or sign up to view verified revenue, charts, and acquisition
            details.
          </p>
        </div>
      </div>
    </div>
  );
}
