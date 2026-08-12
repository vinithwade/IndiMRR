"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function SiteHeaderClient({
  demo,
  user,
  forceMarketing = false,
}: {
  demo: boolean;
  user: { email: string; name?: string | null } | null;
  forceMarketing?: boolean;
}) {
  const pathname = usePathname();

  if (!forceMarketing && pathname?.startsWith("/dashboard")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-baseline gap-1.5"
          >
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {BRAND.name}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-primary sm:inline">
              verified
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className="text-sm text-foreground transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <CurrencySwitcher />
          {demo && (
            <span className="hidden rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary sm:inline">
              Demo mode
            </span>
          )}
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard/startups/new">Add startup</Link>
              </Button>
              <UserMenu email={user.email} name={user.name} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
