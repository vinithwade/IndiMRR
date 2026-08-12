"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeNext(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDemoMode()) {
      toast.message("Demo mode", {
        description:
          "Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY to enable real auth.",
      });
      router.push(next);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success(
          "Check your email to confirm, or continue if confirmations are disabled."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    if (isDemoMode()) {
      toast.message("Connect Supabase to enable Google auth");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) toast.error(error.message);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-4 border border-border/80 bg-card/50 p-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Access verified startups, offers, and deposits."
            : "List a verified startup or start buying."}
        </p>
      </div>
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
      >
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href={`/auth/signup?next=${encodeURIComponent(next)}`}
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(next)}`}
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
