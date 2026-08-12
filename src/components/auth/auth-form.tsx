"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Building2, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AccountRole = "buyer" | "seller";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

function roleFromParam(value: string | null): AccountRole | null {
  if (value === "buyer" || value === "seller") return value;
  return null;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountRole, setAccountRole] = useState<AccountRole | null>(
    () => roleFromParam(searchParams.get("role"))
  );
  const [detectedRole, setDetectedRole] = useState<AccountRole | null>(null);
  const [detectingRole, setDetectingRole] = useState(false);
  const [loading, setLoading] = useState(false);

  const destination = useMemo(() => {
    if (requestedNext) return requestedNext;
    if (mode === "signup" && accountRole === "seller") {
      return "/dashboard/startups/new";
    }
    if (mode === "signup" && accountRole === "buyer") {
      return "/marketplace";
    }
    return "/dashboard";
  }, [requestedNext, mode, accountRole]);

  useEffect(() => {
    if (mode !== "login") return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setDetectedRole(null);
      setDetectingRole(false);
      return;
    }

    let cancelled = false;
    setDetectingRole(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/account-role?email=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        if (cancelled) return;
        setDetectedRole(
          data.role === "buyer" || data.role === "seller" ? data.role : null
        );
      } catch {
        if (!cancelled) setDetectedRole(null);
      } finally {
        if (!cancelled) setDetectingRole(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [email, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !accountRole) {
      toast.error("Choose whether you’re signing up as a buyer or a seller");
      return;
    }

    if (isDemoMode()) {
      toast.message("Demo mode", {
        description:
          "Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY to enable real auth.",
      });
      router.push(destination);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              account_role: accountRole,
            },
          },
        });
        if (error) throw error;

        // Ensure profile role is set even if trigger already ran / session exists
        if (data.user && accountRole) {
          await supabase
            .from("profiles")
            .update({ account_role: accountRole })
            .eq("id", data.user.id);
        }

        toast.success(
          accountRole === "seller"
            ? "Seller account created — you can list a startup next."
            : "Buyer account created — browse verified startups next."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back");
      }
      router.push(destination);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    if (mode === "signup" && !accountRole) {
      toast.error("Choose buyer or seller before continuing with Google");
      return;
    }
    if (isDemoMode()) {
      toast.message("Connect Supabase to enable Google auth");
      return;
    }
    const supabase = createClient();
    const callback = new URL(`${window.location.origin}/auth/callback`);
    callback.searchParams.set("next", destination);
    if (accountRole) callback.searchParams.set("role", accountRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
      },
    });
    if (error) toast.error(error.message);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-lg space-y-5 border border-border/80 bg-card/50 p-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Access verified startups, offers, and messaging."
            : "First, choose how you want to use VerifiedMRR."}
        </p>
      </div>

      {mode === "signup" && (
        <div className="space-y-3">
          <Label className="text-sm">I am signing up as</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccountRole("buyer")}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                accountRole === "buyer"
                  ? "border-sky-500/60 bg-sky-500/15 ring-1 ring-sky-500/40"
                  : "border-border/70 bg-background/40 hover:border-sky-500/35 hover:bg-sky-500/5"
              )}
            >
              <ShoppingBag
                className={cn(
                  "size-5",
                  accountRole === "buyer" ? "text-sky-300" : "text-muted-foreground"
                )}
              />
              <p className="mt-3 text-sm font-semibold text-sky-200">Buyer</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Browse verified startups, send offers, and chat with founders.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAccountRole("seller")}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                accountRole === "seller"
                  ? "border-amber-500/60 bg-amber-500/15 ring-1 ring-amber-500/40"
                  : "border-border/70 bg-background/40 hover:border-amber-500/35 hover:bg-amber-500/5"
              )}
            >
              <Building2
                className={cn(
                  "size-5",
                  accountRole === "seller"
                    ? "text-amber-300"
                    : "text-muted-foreground"
                )}
              />
              <p className="mt-3 text-sm font-semibold text-amber-200">Seller</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                List your startup, verify MRR with Stripe, and receive offers.
              </p>
            </button>
          </div>
          {accountRole && (
            <p className="text-xs text-muted-foreground">
              Selected:{" "}
              <span
                className={cn(
                  "font-medium",
                  accountRole === "buyer" ? "text-sky-300" : "text-amber-300"
                )}
              >
                {accountRole === "buyer" ? "Buyer account" : "Seller account"}
              </span>
              . You can still do both later.
            </p>
          )}
        </div>
      )}

      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="email">Email</Label>
          {mode === "login" && detectingRole && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Checking…
            </span>
          )}
          {mode === "login" && !detectingRole && detectedRole && (
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                detectedRole === "buyer"
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-300"
              )}
            >
              {detectedRole === "buyer" ? "Buyer" : "Seller"}
            </span>
          )}
        </div>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={loading || (mode === "signup" && !accountRole)}
      >
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : accountRole === "seller"
              ? "Create seller account"
              : accountRole === "buyer"
                ? "Create buyer account"
                : "Choose buyer or seller"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={mode === "signup" && !accountRole}
      >
        Continue with Google
        {mode === "signup" && accountRole
          ? ` as ${accountRole}`
          : ""}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href={`/auth/signup?next=${encodeURIComponent(destination)}`}
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(destination)}`}
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
