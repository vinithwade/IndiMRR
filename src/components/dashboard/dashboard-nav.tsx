"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Store,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/startups/new", label: "Add startup", icon: PlusCircle },
  { href: "/dashboard/offers", label: "My offers", icon: ShoppingBag },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Workspace
      </p>
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
              active
                ? "border-l-2 border-primary bg-primary/10 text-foreground"
                : "border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
      <div className="pt-4">
        <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Sell
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <Building2 className="size-4" />
          Your startups
        </Link>
      </div>
    </nav>
  );
}
