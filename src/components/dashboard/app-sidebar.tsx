"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShoppingBag,
  Store,
  Trophy,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/startups/new", label: "Add startup", icon: PlusCircle },
  { href: "/dashboard/offers", label: "My offers", icon: ShoppingBag },
];

const discoverNav = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function AppSidebar({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initials = (name || email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const sidebarBody = (
    <>
      <div className="border-b border-border/60 px-5 py-5">
        <Link href="/dashboard" className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
            verified
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Seller & buyer workspace</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavGroup
          title="Workspace"
          items={primaryNav}
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />
        <NavGroup
          title="Discover"
          items={discoverNav}
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sell
          </p>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === "/dashboard"
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Building2 className="size-4" />
            Your startups
          </Link>
        </div>

        <div className="mx-1 border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          Connect Stripe to verify MRR and list for sale.
          <Link
            href="/dashboard/startups/new"
            onClick={() => setOpen(false)}
            className="mt-2 block font-medium text-primary hover:underline"
          >
            Start a listing →
          </Link>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 p-4">
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Display currency
          </p>
          <CurrencySwitcher className="w-full [&_[data-slot=select-trigger]]:w-full" />
        </div>

        <Button asChild className="w-full justify-start gap-2">
          <Link href="/dashboard/startups/new" onClick={() => setOpen(false)}>
            <PlusCircle className="size-4" />
            Add startup
          </Link>
        </Button>

        <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 p-2.5">
          <Avatar size="sm" className="rounded-md after:rounded-md">
            <AvatarFallback className="rounded-md bg-primary/15 text-xs text-primary">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name || "Account"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{email}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={signOut}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border/70 bg-[#0e1310] lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 border-b border-border/70 bg-[#0e1310] lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link href="/dashboard" className="flex items-baseline gap-1.5">
            <span className="font-semibold tracking-tight">{BRAND.name}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
              verified
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto border-t border-border/60 bg-[#0e1310]">
            {sidebarBody}
          </div>
        )}
      </div>
    </>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
  }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
