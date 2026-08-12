import Link from "next/link";
import { notFound } from "next/navigation";
import { StartupForm } from "@/components/dashboard/startup-form";
import { ListingUpgrade } from "@/components/dashboard/listing-upgrade";
import { SyncRevenueButton } from "@/components/dashboard/sync-revenue-button";
import { SellerOffers } from "@/components/dashboard/seller-offers";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/supabase/config";
import { getDemoStartups } from "@/lib/demo/data";
import { createClient } from "@/lib/supabase/server";

export default async function ManageStartupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isDemoMode()) {
    const startup =
      getDemoStartups().find((s) => s.id === id) ?? getDemoStartups()[0];
    if (!startup) notFound();
    return (
      <ManageShell
        name={startup.name}
        slug={startup.slug}
        subtitle="Demo edit surface"
      >
        <SyncRevenueButton startupId={startup.id} />
        <ListingUpgrade
          startupId={startup.id}
          currentTier={startup.listing?.tier ?? "free"}
        />
        <div className="border border-border/80 bg-card/40 p-6">
          <StartupForm mode="edit" initial={startup} />
        </div>
        <SellerOffers startupId={startup.id} demo />
      </ManageShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!startup) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("startup_id", startup.id)
    .maybeSingle();

  return (
    <ManageShell
      name={startup.name}
      slug={startup.slug}
      subtitle="Connect Stripe, sync revenue, upgrade listing, review offers."
    >
      <div className="flex flex-wrap gap-2">
        <SyncRevenueButton startupId={startup.id} />
      </div>
      <ListingUpgrade
        startupId={startup.id}
        currentTier={listing?.tier ?? null}
      />
      <div className="border border-border/80 bg-card/40 p-6">
        <StartupForm mode="edit" initial={startup} />
      </div>
      <SellerOffers startupId={startup.id} />
    </ManageShell>
  );
}

function ManageShell({
  name,
  slug,
  subtitle,
  children,
}: {
  name: string;
  slug: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Manage startup</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/startup/${slug}`}>Public page</Link>
        </Button>
      </div>
      {children}
    </div>
  );
}
