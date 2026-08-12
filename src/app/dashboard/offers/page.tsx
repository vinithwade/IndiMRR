import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/currency/money";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

export const metadata = { title: "My offers" };

export default async function BuyerOffersPage() {
  if (isDemoMode()) {
    return (
      <OffersShell>
        <OfferCard
          name="InboxPilot"
          slug="inboxpilot"
          amount={15000000}
          currency="USD"
          status="pending"
          conversationId="demo"
        />
      </OffersShell>
    );
  }

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user || user.id === "demo") return null;

  const { data: offers } = await supabase
    .from("offers")
    .select("*, listings(startup_id, startups(name, slug)), conversations(id)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <OffersShell count={(offers ?? []).length}>
      {(offers ?? []).length === 0 ? (
        <div className="border border-dashed border-border/80 bg-card/20 p-10 text-center">
          <h3 className="text-lg font-semibold">No offers yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            When you send an offer on a listing, it shows up here and opens a
            chat with the seller.
          </p>
          <Button asChild className="mt-6">
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(offers ?? []).map((o) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const listing = o.listings as any;
            const startup = listing?.startups;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const conversationId = (o as any).conversations?.id as
              | string
              | undefined;
            return (
              <OfferCard
                key={o.id}
                name={startup?.name ?? "Startup"}
                slug={startup?.slug ?? ""}
                amount={o.amount_cents}
                currency={o.currency}
                status={o.status}
                accepted={o.status === "accepted"}
                conversationId={conversationId}
              />
            );
          })}
        </div>
      )}
    </OffersShell>
  );
}

function OffersShell({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track offers and seller responses
            {typeof count === "number" ? ` · ${count} total` : ""}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/marketplace">
            Find startups
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}

function OfferCard({
  name,
  slug,
  amount,
  currency,
  status,
  accepted,
  conversationId,
}: {
  name: string;
  slug: string;
  amount: number;
  currency: string;
  status: string;
  accepted?: boolean;
  conversationId?: string;
}) {
  return (
    <div className="border border-border/80 bg-card/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/startup/${slug}`}
          className="font-medium hover:text-primary"
        >
          {name}
        </Link>
        <Badge variant="outline" className="capitalize">
          {status.replaceAll("_", " ")}
        </Badge>
      </div>
      <p className="mt-3 text-xl font-semibold">
        <Money cents={amount} from={currency} />
      </p>
      {conversationId && (
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={`/dashboard/messages/${conversationId}`}>Open chat</Link>
        </Button>
      )}
      {accepted && (
        <div className="mt-4 border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
          Seller accepted. Coordinate asset transfer off-platform (repo, domain,
          Stripe, customers) with your preferred escrow counsel.
        </div>
      )}
    </div>
  );
}
