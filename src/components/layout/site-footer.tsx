"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/constants";

export function SiteFooter({ forceShow = false }: { forceShow?: boolean }) {
  const pathname = usePathname();
  if (!forceShow && pathname?.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold tracking-tight">{BRAND.name}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {BRAND.tagline}. Revenue verified via Stripe. Deposits via Stripe &amp;
            Razorpay.
          </p>
        </div>
        <div className="flex gap-5 text-sm text-muted-foreground">
          <Link href="/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <Link href="/leaderboard" className="hover:text-foreground">
            Leaderboard
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  );
}
