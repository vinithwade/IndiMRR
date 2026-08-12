"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/supabase/config";

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export const NOTIFICATIONS_REFRESH_EVENT = "mrr:notifications-refresh";

function kindIcon(kind: string) {
  if (kind === "message") return MessageSquare;
  if (kind === "offer" || kind === "offer_update") return ShoppingBag;
  return Sparkles;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (!res.ok) return;
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 8000);
    function onRefresh() {
      void load();
    }
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    return () => {
      window.clearInterval(t);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, onRefresh);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnread(0);
  }

  async function openItem(n: NotificationItem) {
    if (!n.read_at && !isDemoMode()) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      );
      setUnread((c) => Math.max(0, c - 1));
    } else if (!n.read_at) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
        )
      );
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-[#0e1310]"
          />
        )}
      </Button>

      {open && (
        <div className="absolute bottom-full right-0 z-[60] mb-2 w-[min(calc(100vw-2rem),22rem)] border border-border/80 bg-[#101610] shadow-xl shadow-black/50 lg:left-full lg:right-auto lg:ml-2">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-[11px] text-muted-foreground">
                Offers, messages & platform updates
              </p>
            </div>
            {unread > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-xs"
                onClick={() => void markAllRead()}
              >
                <CheckCheck className="size-3.5" />
                Mark all
              </Button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 && (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">
                Loading…
              </li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">
                You’re all caught up. New offers and chat replies show up here.
              </li>
            )}
            {items.map((n) => {
              const Icon = kindIcon(n.kind);
              const unreadItem = !n.read_at;
              return (
                <li key={n.id} className="border-b border-border/40 last:border-0">
                  <button
                    type="button"
                    onClick={() => void openItem(n)}
                    className={cn(
                      "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30",
                      unreadItem && "bg-primary/[0.06]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center border",
                        unreadItem
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">
                          {n.title}
                        </span>
                        {unreadItem && (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground/80">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border/60 px-3 py-2">
            <Link
              href="/dashboard/messages"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline"
            >
              Open messages →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
