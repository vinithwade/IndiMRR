"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Send, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/currency/money";
import { useCurrency } from "@/components/currency/currency-provider";
import {
  formatGroupedAmount,
  parseGroupedAmount,
} from "@/lib/currency/format-amount";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/supabase/config";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/components/notifications/notification-bell";

type ChatMessage = {
  id: string;
  senderId?: string;
  senderName?: string;
  body: string;
  kind?: "text" | "offer" | "offer_update";
  meta?: {
    offerId?: string;
    amountCents?: number;
    currency?: string;
    status?: string;
    proposedBy?: "buyer" | "seller";
  };
  createdAt: string;
  mine: boolean;
};

type ConversationMeta = {
  id: string;
  role: "buyer" | "seller";
  startupName: string;
  startupSlug: string;
  offerId: string;
  amountCents: number;
  currency: string;
  offerStatus: string;
};

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    body: "Offer: 150,000 USD",
    kind: "offer",
    meta: {
      offerId: "demo",
      amountCents: 15000000,
      currency: "USD",
      status: "pending",
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    mine: true,
    senderName: "You",
  },
  {
    id: "2",
    body: "Thanks for the offer. Happy to share diligence docs this week.",
    kind: "text",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    mine: false,
    senderName: "Seller",
  },
];

export function ConversationThread({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const { currency: displayCurrency } = useCurrency();
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerMajor, setOfferMajor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (isDemoMode() || conversationId === "demo") {
      setMeta({
        id: "demo",
        role: "buyer",
        startupName: "InboxPilot",
        startupSlug: "inboxpilot",
        offerId: "demo",
        amountCents: 15000000,
        currency: "USD",
        offerStatus: "pending",
      });
      setMessages(DEMO_MESSAGES);
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/conversations/${conversationId}`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Conversation not found");
      router.push("/dashboard/messages");
      return;
    }
    setMeta(data.conversation);
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [conversationId, router]);

  useEffect(() => {
    void load();
    if (isDemoMode() || conversationId === "demo") return;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load, conversationId]);

  useEffect(() => {
    if (isDemoMode() || conversationId === "demo") return;

    let cancelled = false;

    async function heartbeat(active: boolean) {
      try {
        await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: active ? conversationId : null,
          }),
          keepalive: !active,
        });
        if (active && !cancelled) {
          window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
        }
      } catch {
        // ignore transient network errors
      }
    }

    void heartbeat(true);
    const t = window.setInterval(() => void heartbeat(true), 15000);

    function onVisibility() {
      if (document.visibilityState === "visible") void heartbeat(true);
      else void heartbeat(false);
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibility);
      void heartbeat(false);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const offerDisplay = useMemo(
    () =>
      offerMajor > 0 ? formatGroupedAmount(offerMajor, displayCurrency) : "",
    [offerMajor, displayCurrency]
  );

  const latestPendingOfferId = useMemo(() => {
    if (meta?.offerStatus !== "pending") return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.kind === "offer") {
        const offerStatus = m.meta?.status ?? "pending";
        if (offerStatus === "pending") return m.id;
      }
    }
    return null;
  }, [messages, meta?.offerStatus]);

  const latestOffer = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].kind === "offer") return messages[i];
    }
    return null;
  }, [messages]);

  async function onSendText(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    if (isDemoMode() || conversationId === "demo") {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          body,
          kind: "text",
          createdAt: new Date().toISOString(),
          mine: true,
          senderName: "You",
        },
      ]);
      setDraft("");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setDraft("");
      setMessages((prev) => [...prev, { ...data.message, senderName: "You" }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function onSendOffer() {
    if (!offerMode) {
      setOfferMode(true);
      if (meta?.amountCents) {
        setOfferMajor(Math.round(meta.amountCents / 100));
      }
      return;
    }

    const amountCents = Math.round(offerMajor * 100);
    if (!amountCents || sending) {
      toast.error("Enter an offer amount");
      return;
    }

    if (isDemoMode() || conversationId === "demo") {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-offer-${Date.now()}`,
          body: `Offer: ${formatGroupedAmount(offerMajor, displayCurrency)} ${displayCurrency}`,
          kind: "offer",
          meta: {
            offerId: "demo",
            amountCents,
            currency: displayCurrency,
            status: "pending",
          },
          createdAt: new Date().toISOString(),
          mine: true,
          senderName: "You",
        },
      ]);
      setMeta((m) =>
        m
          ? {
              ...m,
              amountCents,
              currency: displayCurrency,
              offerStatus: "pending",
            }
          : m
      );
      setOfferMode(false);
      setOfferMajor(0);
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "offer",
          amountCents,
          currency: displayCurrency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send offer");
      setMessages((prev) => [...prev, { ...data.message, senderName: "You" }]);
      if (data.conversation) {
        setMeta((m) =>
          m
            ? {
                ...m,
                amountCents: data.conversation.amountCents,
                currency: data.conversation.currency,
                offerStatus: data.conversation.offerStatus,
              }
            : m
        );
      }
      setOfferMode(false);
      setOfferMajor(0);
      toast.success("Offer sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setSending(false);
    }
  }

  async function decideOffer(status: "accepted" | "rejected") {
    if (!meta?.offerId || decidingId) return;

    if (isDemoMode() || conversationId === "demo") {
      setMeta((m) => (m ? { ...m, offerStatus: status } : m));
      setMessages((prev) =>
        prev.map((m) =>
          m.kind === "offer"
            ? { ...m, meta: { ...m.meta, status } }
            : m
        )
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${status}-${Date.now()}`,
          body:
            status === "accepted"
              ? "Offer accepted"
              : "Offer rejected",
          kind: "offer_update",
          meta: { status, offerId: "demo" },
          createdAt: new Date().toISOString(),
          mine: true,
          senderName: "You",
        },
      ]);
      return;
    }

    setDecidingId(status);
    try {
      const res = await fetch(`/api/offers/${meta.offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update offer");
      toast.success(status === "accepted" ? "Offer accepted" : "Offer rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update offer");
    } finally {
      setDecidingId(null);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading chat…</p>;
  }

  const status = meta?.offerStatus ?? "pending";
  const isBuyer = meta?.role === "buyer";
  const isSeller = meta?.role === "seller";
  // Both sides get Offer above Send
  const canOffer = status !== "withdrawn" && status !== "expired";
  const offerButtonLabel = offerMode ? "Send offer" : "Offer";

  const latestProposedBy =
    latestOffer?.meta?.proposedBy ??
    (latestOffer && !latestOffer.mine
      ? meta?.role === "seller"
        ? "buyer"
        : "seller"
      : latestOffer?.mine
        ? meta?.role
        : "buyer");

  const canDecide =
    status === "pending" &&
    Boolean(meta?.offerId) &&
    ((latestProposedBy === "buyer" && isSeller) ||
      (latestProposedBy === "seller" && isBuyer) ||
      (!latestOffer?.meta?.proposedBy && isSeller));

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[420px] flex-col border border-border/80 bg-card/40">
      <div
        className={cn(
          "flex items-start justify-between gap-3 border-b px-4 py-3 transition-colors",
          status === "accepted" &&
            "border-emerald-500/40 bg-emerald-500/20",
          status === "rejected" && "border-red-500/40 bg-red-500/20",
          status !== "accepted" &&
            status !== "rejected" &&
            "border-border/60"
        )}
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <Button asChild size="sm" variant="ghost" className="-ml-2">
              <Link href="/dashboard/messages">
                <ArrowLeft className="size-4" />
                Inbox
              </Link>
            </Button>
          </div>
          <Link
            href={
              meta?.startupSlug ? `/startup/${meta.startupSlug}` : "/marketplace"
            }
            className="truncate text-base font-semibold hover:text-primary"
          >
            {meta?.startupName ?? "Conversation"}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            Offer{" "}
            {meta ? (
              <Money cents={meta.amountCents} from={meta.currency} />
            ) : null}
            {" · "}
            <span
              className={cn(
                "font-medium",
                meta?.role === "buyer" ? "text-sky-300" : "text-amber-300"
              )}
            >
              {meta?.role === "buyer"
                ? "You are the buyer"
                : "You are the seller"}
            </span>
            {status === "accepted" && " · accepted"}
            {status === "rejected" && " · rejected"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              status === "accepted" &&
                "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
              status === "rejected" &&
                "border-red-500/50 bg-red-500/15 text-red-300"
            )}
          >
            {status.replaceAll("_", " ")}
          </Badge>
          {canDecide && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 bg-emerald-500 px-2 text-xs text-emerald-950 hover:bg-emerald-400"
                disabled={Boolean(decidingId)}
                onClick={() => void decideOffer("accepted")}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-red-500/50 px-2 text-xs text-red-300 hover:bg-red-500/15"
                disabled={Boolean(decidingId)}
                onClick={() => void decideOffer("rejected")}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const isOffer = m.kind === "offer";
          const isUpdate = m.kind === "offer_update";
          const offerStatus = m.meta?.status ?? "pending";
          const showActions =
            isOffer &&
            canDecide &&
            !m.mine &&
            m.id === latestPendingOfferId;

          return (
            <div
              key={m.id}
              className={cn("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] border px-3 py-2 text-sm leading-relaxed",
                  isUpdate &&
                    offerStatus === "accepted" &&
                    "border-emerald-500/40 bg-emerald-500/10",
                  isUpdate &&
                    offerStatus === "rejected" &&
                    "border-red-500/40 bg-red-500/10",
                  isOffer &&
                    "border-primary/35 bg-primary/10",
                  !isOffer &&
                    !isUpdate &&
                    (m.mine
                      ? "border-primary/40 bg-primary/15 text-foreground"
                      : "border-border/70 bg-muted/40 text-foreground")
                )}
              >
                {!m.mine && (
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.senderName || "Them"}
                  </p>
                )}
                {isOffer && m.meta?.amountCents != null ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      Offer
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      <Money
                        cents={m.meta.amountCents}
                        from={m.meta.currency ?? "USD"}
                      />
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {(offerStatus || "pending").replaceAll("_", " ")}
                    </p>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.body}</p>
                )}

                {showActions && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                      disabled={Boolean(decidingId)}
                      onClick={() => void decideOffer("accepted")}
                    >
                      <Check className="size-3.5" />
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-300 hover:bg-red-500/15"
                      disabled={Boolean(decidingId)}
                      onClick={() => void decideOffer("rejected")}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                )}

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/60 p-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            {offerMode ? (
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={offerDisplay}
                onChange={(e) =>
                  setOfferMajor(parseGroupedAmount(e.target.value))
                }
                placeholder={`Counter offer amount (${displayCurrency})`}
                className="min-h-[64px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onSendOffer();
                  }
                  if (e.key === "Escape") {
                    setOfferMode(false);
                    setOfferMajor(0);
                  }
                }}
              />
            ) : (
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                rows={2}
                className="min-h-[64px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSendText();
                  }
                }}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-col justify-end gap-2 self-stretch">
            <Button
              type="button"
              variant={offerMode ? "default" : "outline"}
              disabled={sending || !canOffer}
              onClick={() => void onSendOffer()}
              className="min-w-[7.5rem]"
            >
              <Tag className="size-4" />
              {offerButtonLabel}
            </Button>
            <Button
              type="button"
              disabled={sending || (!offerMode && !draft.trim())}
              onClick={() => {
                if (offerMode) {
                  setOfferMode(false);
                  setOfferMajor(0);
                  return;
                }
                void onSendText();
              }}
              className="min-w-[7.5rem]"
            >
              <Send className="size-4" />
              Send
            </Button>
          </div>
        </div>
        {offerMode && (
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOfferMode(false);
              setOfferMajor(0);
            }}
          >
            Cancel — write a message instead
          </button>
        )}
      </div>
    </div>
  );
}
