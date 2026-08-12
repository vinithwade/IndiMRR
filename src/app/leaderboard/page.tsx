import { LeaderboardTable } from "@/components/marketplace/leaderboard-table";
import { listPublishedStartups } from "@/lib/data/startups";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const startups = await listPublishedStartups({ sort: "mrr" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Ranked by verified monthly recurring revenue. Data refreshes from
          connected Stripe accounts.
        </p>
      </div>
      <div className="mt-8 animate-fade-up-delay-1">
        <LeaderboardTable startups={startups} />
      </div>
    </div>
  );
}
