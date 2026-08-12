"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, Plus, ShoppingBag } from "lucide-react";

export function UserMenu({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const router = useRouter();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-1.5 hover:bg-accent"
        >
          <Avatar size="sm" className="rounded-md after:rounded-md">
            <AvatarFallback className="rounded-md bg-primary/15 text-xs text-primary">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[140px] truncate text-sm sm:inline">
            {name || email.split("@")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{name || "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/offers")}>
          <ShoppingBag />
          My offers
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/startups/new")}
        >
          <Plus />
          Add startup
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
