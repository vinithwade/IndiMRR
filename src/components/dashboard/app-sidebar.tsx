"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  ShoppingBag,
  Store,
  Trophy,
  X,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/currency/currency-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/offers", label: "My offers", icon: ShoppingBag },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const discoverNav = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const PREFETCH_ROUTES = [
  "/dashboard",
  "/dashboard/startups",
  "/dashboard/offers",
  "/dashboard/messages",
  "/marketplace",
  "/leaderboard",
];

export function AppSidebar({
  email,
  name,
  accountRole,
}: {
  email: string;
  name?: string | null;
  accountRole?: "buyer" | "seller" | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const initials = (name || email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    PREFETCH_ROUTES.forEach((href) => router.prefetch(href));
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function go(href: string) {
    setOpen(false);
    if (href === pathname) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const activePath = pendingHref ?? pathname;

  const sidebarBody = (
    <>
      <div className="border-b border-border/60 px-5 py-5">
        <button
          type="button"
          onClick={() => go("/dashboard")}
          className="flex items-baseline gap-1.5 text-left"
        >
          <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
            verified
          </span>
        </button>
        <p className="mt-1 text-xs text-muted-foreground">
          Buyer &amp; seller roles depend on each chat
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavGroup
          title="Workspace"
          items={primaryNav}
          pathname={activePath}
          onNavigate={go}
        />
        <NavGroup
          title="Discover"
          items={discoverNav}
          pathname={activePath}
          onNavigate={go}
        />
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sell
          </p>
          <button
            type="button"
            onClick={() => go("/dashboard/startups")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
              activePath === "/dashboard/startups" ||
                (activePath.startsWith("/dashboard/startups/") &&
                  activePath !== "/dashboard/startups/new")
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Building2 className="size-4" />
            Your startups
          </button>
        </div>

        <div className="mx-1 border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          Connect Stripe to verify MRR and list for sale.
          <button
            type="button"
            onClick={() => go("/dashboard/startups/new")}
            className="mt-2 block font-medium text-primary hover:underline"
          >
            Start a listing →
          </button>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Display currency
            </p>
            <NotificationBell className="shrink-0" />
          </div>
          <CurrencySwitcher className="w-full" />
        </div>

        <Button
          className="w-full justify-start gap-2"
          onClick={() => go("/dashboard/startups/new")}
        >
          <PlusCircle className="size-4" />
          Add startup
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md border border-border/60 bg-card/40 p-2.5 text-left outline-none transition-colors hover:border-border hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar size="sm" className="rounded-md after:rounded-md">
                <AvatarFallback className="rounded-md bg-primary/15 text-xs text-primary">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name || "Account"}</p>
                <p className="truncate text-[11px] text-muted-foreground">{email}</p>
                {accountRole && (
                  <p
                    className={cn(
                      "mt-0.5 text-[10px] font-medium uppercase tracking-wider",
                      accountRole === "buyer" ? "text-sky-300" : "text-amber-300"
                    )}
                  >
                    {accountRole === "buyer" ? "Buyer account" : "Seller account"}
                  </p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[14rem]"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{name || "Account"}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              {accountRole && (
                <p
                  className={cn(
                    "mt-1 text-[10px] font-medium uppercase tracking-wider",
                    accountRole === "buyer" ? "text-sky-300" : "text-amber-300"
                  )}
                >
                  {accountRole === "buyer" ? "Buyer account" : "Seller account"}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <CurrencySwitcher compact />
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
  onNavigate: (href: string) => void;
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
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
