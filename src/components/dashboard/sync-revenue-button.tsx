"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/supabase/config";

export function SyncRevenueButton({ startupId }: { startupId: string }) {
  const [loading, setLoading] = useState(false);

  async function sync() {
    if (isDemoMode()) {
      toast.success("Demo: revenue sync would run against Stripe");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/startups/${startupId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      toast.success(
        `Synced MRR: $${((data.mrrCents ?? 0) / 100).toLocaleString()}`
      );
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={sync} disabled={loading}>
      {loading ? "Syncing…" : "Sync Stripe revenue"}
    </Button>
  );
}
