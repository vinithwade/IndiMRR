"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthGateContextValue = {
  isAuthenticated: boolean;
  /** Returns true if allowed to navigate; otherwise opens the login popup */
  requireAuth: (nextPath?: string) => boolean;
  openAuthGate: (nextPath?: string) => void;
  closeAuthGate: () => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");

  const closeAuthGate = useCallback(() => setOpen(false), []);

  const openAuthGate = useCallback((path?: string) => {
    // Never show the gate on auth pages
    if (typeof window !== "undefined") {
      const current = window.location.pathname;
      if (current.startsWith("/auth")) return;
    }
    setNextPath(path || "/dashboard");
    setOpen(true);
  }, []);

  const requireAuth = useCallback(
    (path?: string) => {
      if (isAuthenticated) return true;
      openAuthGate(path);
      return false;
    },
    [isAuthenticated, openAuthGate]
  );

  // Dismiss popup whenever we land on login/signup (or after auth)
  useEffect(() => {
    if (pathname?.startsWith("/auth") || isAuthenticated) {
      setOpen(false);
    }
  }, [pathname, isAuthenticated]);

  const value = useMemo(
    () => ({ isAuthenticated, requireAuth, openAuthGate, closeAuthGate }),
    [isAuthenticated, requireAuth, openAuthGate, closeAuthGate]
  );

  const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/auth/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-none border-border bg-card sm:rounded-none">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              <Lock className="size-4" />
            </div>
            <DialogTitle className="text-xl">Sign in to view startups</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Verified revenue profiles, charts, and acquisition details are available
              to members. Log in or create a free account to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-2">
            <Button asChild className="w-full">
              <Link href={loginHref} onClick={closeAuthGate}>
                Log in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={signupHref} onClick={closeAuthGate}>
                Create account
              </Link>
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Browsing the marketplace list is free — full startup pages require an account.
          </p>
        </DialogContent>
      </Dialog>
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within AuthGateProvider");
  }
  return ctx;
}
