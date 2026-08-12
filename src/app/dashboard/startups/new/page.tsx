import { StartupForm } from "@/components/dashboard/startup-form";

export const metadata = { title: "Add startup" };

export default function NewStartupPage() {
  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Add startup</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create a public profile, connect Stripe for verified MRR, and optionally
          list for sale on the marketplace.
        </p>
      </div>
      <div className="border border-border/80 bg-card/40 p-6">
        <StartupForm mode="create" />
      </div>
    </div>
  );
}
