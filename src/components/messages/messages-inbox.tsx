"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Money } from "@/components/currency/money";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/supabase/config";
import { ConversationThread } from "@/components/messages/conversation-thread";

type ConversationSummary = {
  id: string;
  startupName: string;
  counterpartName: string;
  amountCents: number;
  currency: string;
  offerStatus: string;
  role: "buyer" | "seller";
  lastMessageAt: string;
};

const DEMO: ConversationSummary[] = [
  {
    id: "demo",
    startupName: "InboxPilot",
    counterpartName: "Alex Seller",
    amountCents: 15000000,
    currency: "USD",
    offerStatus: "pending",
    role: "buyer",
    lastMessageAt: new Date().toISOString(),
  },
];

export function MessagesInbox({
  activeId,
}: {
  activeId?: string;
}) {
  const pathname = usePathname();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setItems(DEMO);
      setLoading(false);
      return;
    }
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setItems(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, [pathname]);

  const selected = activeId ?? items[0]?.id;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        className={cn(
          "border border-border/80 bg-card/30",
          activeId && "hidden lg:block"
        )}
      >
        <div className="border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-medium">Inbox</h2>
          <p className="text-xs text-muted-foreground">
            Blue = you’re buying · Amber = you’re selling
          </p>
        </div>
        {loading && (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        )}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No conversations yet. Send an offer on a listing to start chatting.
            </p>
            <Link
              href="/marketplace"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Browse marketplace
            </Link>
          </div>
        )}
        <ul className="divide-y divide-border/50">
          {items.map((c) => {
            const active = c.id === selected;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/messages/${c.id}`}
                  className={cn(
                    "block px-4 py-3 transition-colors",
                    active
                      ? "bg-primary/10"
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.startupName}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px]",
                        c.role === "buyer"
                          ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      )}
                    >
                      {c.role === "buyer" ? "You’re buying" : "You’re selling"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.role === "buyer" ? "Seller" : "Buyer"}:{" "}
                    {c.counterpartName} ·{" "}
                    <Money cents={c.amountCents} from={c.currency} />
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.offerStatus.replaceAll("_", " ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className={cn(!activeId && "hidden lg:block")}>
        {selected ? (
          <ConversationThread conversationId={selected} />
        ) : (
          <div className="flex h-[420px] items-center justify-center border border-dashed border-border/70 text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
