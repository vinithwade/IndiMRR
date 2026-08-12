"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { isDemoMode } from "@/lib/supabase/config";
import { slugify } from "@/lib/format";

export function StartupForm({
  mode = "create",
  initial,
}: {
  mode?: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    category: string;
    tech_stack: string[];
    website: string | null;
    for_sale: boolean;
    asking_price_cents: number | null;
    asking_currency: string;
    multiple: number | null;
    sale_notes: string | null;
    anonymous: boolean;
    status: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "SaaS");
  const [techStack, setTechStack] = useState(
    (initial?.tech_stack ?? []).join(", ")
  );
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [forSale, setForSale] = useState(initial?.for_sale ?? false);
  const [askingPrice, setAskingPrice] = useState(
    initial?.asking_price_cents ? String(initial.asking_price_cents / 100) : ""
  );
  const [multiple, setMultiple] = useState(
    initial?.multiple != null ? String(initial.multiple) : ""
  );
  const [saleNotes, setSaleNotes] = useState(initial?.sale_notes ?? "");
  const [anonymous, setAnonymous] = useState(initial?.anonymous ?? false);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [stripeKey, setStripeKey] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDemoMode()) {
      toast.success(
        "Demo: startup would be saved. Connect Supabase to persist data."
      );
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    try {
      const priceNum = askingPrice ? Number(askingPrice) : null;
      const multipleNum = multiple.trim() === "" ? null : Number(multiple);

      if (forSale && (priceNum == null || Number.isNaN(priceNum) || priceNum <= 0)) {
        throw new Error("Enter a valid asking price in USD (e.g. 120000)");
      }
      if (
        multipleNum != null &&
        (Number.isNaN(multipleNum) || multipleNum < 0 || multipleNum > 1_000_000)
      ) {
        throw new Error(
          "ARR multiple should be a ratio like 3.5 (meaning 3.5× ARR), not a dollar amount"
        );
      }

      const payload = {
        name,
        slug: slug || slugify(name),
        tagline,
        description,
        category,
        tech_stack: techStack
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        website,
        for_sale: forSale,
        asking_price_cents:
          priceNum != null ? Math.round(priceNum * 100) : null,
        asking_currency: "USD",
        multiple: multipleNum,
        sale_notes: saleNotes,
        anonymous,
        status,
        stripe_restricted_key: stripeKey || undefined,
      };

      const url =
        mode === "edit" && initial
          ? `/api/startups/${initial.id}`
          : "/api/startups";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(mode === "edit" ? "Startup updated" : "Startup created");
      router.push(`/dashboard/startups/${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Startup name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (mode === "create") setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tech">Tech stack (comma separated)</Label>
          <Input
            id="tech"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stripe">Stripe restricted API key</Label>
          <Input
            id="stripe"
            type="password"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            placeholder="rk_live_… (read-only)"
          />
          <p className="text-xs text-muted-foreground">
            Used to verify MRR automatically. Encrypted at rest.
          </p>
        </div>
      </div>

      <div className="border border-border/80 p-4 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={forSale}
            onChange={(e) => setForSale(e.target.checked)}
          />
          List for sale on marketplace
        </label>
        {forSale && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Asking price (USD)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={1000}
                placeholder="120000"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Total sale price in dollars (e.g. 120000 for $120,000).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiple">ARR multiple</Label>
              <Input
                id="multiple"
                type="number"
                min={0}
                step="0.1"
                placeholder="3.5"
                value={multiple}
                onChange={(e) => setMultiple(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Valuation multiple of ARR — e.g. 3.5 means 3.5× annual revenue, not a dollar amount.
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Sale notes</Label>
              <Textarea
                id="notes"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              List anonymously
            </label>
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : mode === "edit" ? "Save changes" : "Create startup"}
      </Button>
    </form>
  );
}
