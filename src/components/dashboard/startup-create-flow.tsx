"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Rocket,
  ShieldCheck,
  Store,
  Sparkles,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "welcome",
    title: "How this works",
    subtitle: "A quick tour before you fill anything in",
  },
  {
    id: "basics",
    title: "Name your startup",
    subtitle: "This is what buyers and visitors will see first",
  },
  {
    id: "story",
    title: "Tell your story",
    subtitle: "Help people understand what you built",
  },
  {
    id: "details",
    title: "Links & tech",
    subtitle: "Optional details that build trust",
  },
  {
    id: "verify",
    title: "Verify your revenue",
    subtitle: "Connect Stripe so MRR is trusted — not screenshots",
  },
  {
    id: "listing",
    title: "Publish & sell",
    subtitle: "Choose visibility and whether you’re open to acquisition",
  },
  {
    id: "review",
    title: "Review & create",
    subtitle: "Confirm everything looks right, then launch your profile",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function StartupCreateFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SaaS");
  const [techStack, setTechStack] = useState("");
  const [website, setWebsite] = useState("");
  const [forSale, setForSale] = useState(false);
  const [askingPrice, setAskingPrice] = useState("");
  const [multiple, setMultiple] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState("draft");
  const [stripeKey, setStripeKey] = useState("");

  const current = STEPS[step]!;
  const progress = ((step + 1) / STEPS.length) * 100;

  const canContinue = useMemo(() => {
    switch (current.id as StepId) {
      case "welcome":
        return true;
      case "basics":
        return name.trim().length >= 2 && slug.trim().length >= 2;
      case "story":
        return true;
      case "details":
        return true;
      case "verify":
        return true;
      case "listing":
        if (!forSale) return true;
        const price = Number(askingPrice);
        return askingPrice !== "" && !Number.isNaN(price) && price > 0;
      case "review":
        return name.trim().length >= 2;
      default:
        return true;
    }
  }, [current.id, name, slug, forSale, askingPrice]);

  function next() {
    if (!canContinue) {
      toast.error("Please fill the required fields before continuing");
      return;
    }
    if (current.id === "listing" && forSale) {
      const multipleNum = multiple.trim() === "" ? null : Number(multiple);
      if (
        multipleNum != null &&
        (Number.isNaN(multipleNum) || multipleNum < 0 || multipleNum > 1_000_000)
      ) {
        toast.error("ARR multiple should look like 3.5 (not a dollar amount)");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function createStartup() {
    if (isDemoMode()) {
      toast.success(
        "Demo: startup would be saved. Connect Supabase to persist data."
      );
      router.push("/dashboard/startups");
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

      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Startup created");
      router.push(`/dashboard/startups/${data.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="truncate">{current.title}</span>
        </div>
        <div className="h-1.5 overflow-hidden bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="hidden gap-1 sm:flex">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => i <= step && setStep(i)}
              className={cn(
                "h-1 flex-1 transition-colors",
                i < step
                  ? "bg-primary/70"
                  : i === step
                    ? "bg-primary"
                    : "bg-muted"
              )}
              aria-label={s.title}
            />
          ))}
        </div>
      </div>

      <div className="border border-border/80 bg-card/40 p-5 sm:p-7">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>
        </div>

        <div className="min-h-[280px]">
          {current.id === "welcome" && <WelcomeStep />}
          {current.id === "basics" && (
            <BasicsStep
              name={name}
              slug={slug}
              category={category}
              onName={(v) => {
                setName(v);
                setSlug(slugify(v));
              }}
              onSlug={setSlug}
              onCategory={setCategory}
            />
          )}
          {current.id === "story" && (
            <StoryStep
              tagline={tagline}
              description={description}
              onTagline={setTagline}
              onDescription={setDescription}
            />
          )}
          {current.id === "details" && (
            <DetailsStep
              website={website}
              techStack={techStack}
              onWebsite={setWebsite}
              onTechStack={setTechStack}
            />
          )}
          {current.id === "verify" && (
            <VerifyStep stripeKey={stripeKey} onStripeKey={setStripeKey} />
          )}
          {current.id === "listing" && (
            <ListingStep
              status={status}
              forSale={forSale}
              askingPrice={askingPrice}
              multiple={multiple}
              saleNotes={saleNotes}
              anonymous={anonymous}
              onStatus={setStatus}
              onForSale={setForSale}
              onAskingPrice={setAskingPrice}
              onMultiple={setMultiple}
              onSaleNotes={setSaleNotes}
              onAnonymous={setAnonymous}
            />
          )}
          {current.id === "review" && (
            <ReviewStep
              name={name}
              slug={slug}
              category={category}
              tagline={tagline}
              description={description}
              website={website}
              techStack={techStack}
              status={status}
              stripeConnected={Boolean(stripeKey.trim())}
              forSale={forSale}
              askingPrice={askingPrice}
              multiple={multiple}
              anonymous={anonymous}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 0 || loading}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {current.id !== "review" ? (
            <Button type="button" onClick={next} disabled={!canContinue}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={createStartup} disabled={loading}>
              {loading ? "Creating…" : "Create startup"}
              <Check className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  const cards = [
    {
      icon: Rocket,
      title: "Create a public profile",
      body: "Show your product, category, and story on VerifiedMRR so founders and buyers can discover you.",
    },
    {
      icon: ShieldCheck,
      title: "Verify MRR with Stripe",
      body: "Connect a read-only Stripe key. We sync revenue automatically so numbers are trusted — not screenshots.",
    },
    {
      icon: Store,
      title: "Optionally list for sale",
      body: "If you’re open to acquisition, set an asking price. Buyers can send free offers and chat with you.",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          You’re about to list a startup the VerifiedMRR way
        </p>
        <p className="mt-2">
          We’ll walk you through each piece. You can skip optional steps and
          edit everything later from{" "}
          <span className="text-foreground">Your startups</span>.
        </p>
      </div>
      <div className="space-y-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex gap-3 border border-border/70 bg-background/40 p-4"
          >
            <div className="flex size-9 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              <c.icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{c.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BasicsStep({
  name,
  slug,
  category,
  onName,
  onSlug,
  onCategory,
}: {
  name: string;
  slug: string;
  category: string;
  onName: (v: string) => void;
  onSlug: (v: string) => void;
  onCategory: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Hint>
        Pick a clear product name. The slug becomes your public URL:{" "}
        <span className="text-foreground">/startup/{slug || "your-slug"}</span>
      </Hint>
      <div className="space-y-2">
        <Label htmlFor="name">Startup name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="e.g. InboxPilot"
          required
          autoFocus
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">URL slug *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => onSlug(slugify(e.target.value))}
            placeholder="inboxpilot"
          />
          <p className="text-[11px] text-muted-foreground">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={category} onValueChange={onCategory}>
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
      </div>
    </div>
  );
}

function StoryStep({
  tagline,
  description,
  onTagline,
  onDescription,
}: {
  tagline: string;
  description: string;
  onTagline: (v: string) => void;
  onDescription: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Hint>
        Write like you’re explaining the product to a smart stranger. Buyers
        skim taglines first, then read the description.
      </Hint>
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => onTagline(e.target.value)}
          placeholder="AI inbox that drafts replies in your voice"
          autoFocus
        />
        <p className="text-[11px] text-muted-foreground">
          One short sentence — ideally under 80 characters.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={7}
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Who is it for? What problem does it solve? What’s unique?"
        />
      </div>
    </div>
  );
}

function DetailsStep({
  website,
  techStack,
  onWebsite,
  onTechStack,
}: {
  website: string;
  techStack: string;
  onWebsite: (v: string) => void;
  onTechStack: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Hint>
        These are optional but helpful. You can leave them blank and add them
        later.
      </Hint>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={website}
          onChange={(e) => onWebsite(e.target.value)}
          placeholder="https://yourproduct.com"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tech">Tech stack</Label>
        <Input
          id="tech"
          value={techStack}
          onChange={(e) => onTechStack(e.target.value)}
          placeholder="Next.js, Supabase, Stripe"
        />
        <p className="text-[11px] text-muted-foreground">
          Separate tools with commas.
        </p>
      </div>
    </div>
  );
}

function VerifyStep({
  stripeKey,
  onStripeKey,
}: {
  stripeKey: string;
  onStripeKey: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 border border-primary/25 bg-primary/5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
          <KeyRound className="size-4" />
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground">
          <p className="font-medium text-foreground">Why Stripe?</p>
          <p className="mt-1">
            VerifiedMRR pulls live MRR from Stripe so buyers trust your numbers.
            Use a <span className="text-foreground">restricted read-only</span>{" "}
            key — never your secret key that can charge customers.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stripe">Stripe restricted API key</Label>
        <Input
          id="stripe"
          type="password"
          value={stripeKey}
          onChange={(e) => onStripeKey(e.target.value)}
          placeholder="rk_live_… or rk_test_…"
          autoFocus
        />
        <p className="text-[11px] text-muted-foreground">
          Encrypted at rest. You can skip now and connect later from Manage
          startup.
        </p>
      </div>
      <ol className="list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground">
        <li>Open Stripe → Developers → API keys</li>
        <li>Create a restricted key with read access to Charges & Customers</li>
        <li>Paste it here</li>
      </ol>
    </div>
  );
}

function ListingStep({
  status,
  forSale,
  askingPrice,
  multiple,
  saleNotes,
  anonymous,
  onStatus,
  onForSale,
  onAskingPrice,
  onMultiple,
  onSaleNotes,
  onAnonymous,
}: {
  status: string;
  forSale: boolean;
  askingPrice: string;
  multiple: string;
  saleNotes: string;
  anonymous: boolean;
  onStatus: (v: string) => void;
  onForSale: (v: boolean) => void;
  onAskingPrice: (v: string) => void;
  onMultiple: (v: string) => void;
  onSaleNotes: (v: string) => void;
  onAnonymous: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <Hint>
        <span className="text-foreground">Draft</span> stays private to you.{" "}
        <span className="text-foreground">Published</span> appears on the
        marketplace/leaderboard once live.
      </Hint>
      <div className="space-y-2">
        <Label>Profile status</Label>
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft — only you can see it</SelectItem>
            <SelectItem value="published">Published — visible publicly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <label className="flex cursor-pointer items-start gap-3 border border-border/70 bg-background/40 p-4">
        <input
          type="checkbox"
          className="mt-1"
          checked={forSale}
          onChange={(e) => onForSale(e.target.checked)}
        />
        <span>
          <span className="block text-sm font-medium">
            List for sale on the marketplace
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Buyers can send free offers and message you. Closing happens
            off-platform.
          </span>
        </span>
      </label>

      {forSale && (
        <div className="grid gap-4 border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Asking price (USD) *</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={1000}
              placeholder="120000"
              value={askingPrice}
              onChange={(e) => onAskingPrice(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Total sale price, e.g. 120000 for $120,000.
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
              onChange={(e) => onMultiple(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              e.g. 3.5 means 3.5× annual revenue — not dollars.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Sale notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={saleNotes}
              onChange={(e) => onSaleNotes(e.target.value)}
              placeholder="What’s included? Timeline? Any constraints?"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => onAnonymous(e.target.checked)}
            />
            List anonymously (hide brand name publicly)
          </label>
        </div>
      )}
    </div>
  );
}

function ReviewStep(props: {
  name: string;
  slug: string;
  category: string;
  tagline: string;
  description: string;
  website: string;
  techStack: string;
  status: string;
  stripeConnected: boolean;
  forSale: boolean;
  askingPrice: string;
  multiple: string;
  anonymous: boolean;
}) {
  const rows = [
    ["Name", props.name],
    ["URL", `/startup/${props.slug}`],
    ["Category", props.category],
    ["Tagline", props.tagline || "—"],
    ["Website", props.website || "—"],
    ["Tech", props.techStack || "—"],
    ["Status", props.status],
    ["Stripe", props.stripeConnected ? "Key provided" : "Skipped for now"],
    [
      "For sale",
      props.forSale
        ? `Yes · $${props.askingPrice || "—"}${props.multiple ? ` · ${props.multiple}× ARR` : ""}${props.anonymous ? " · anonymous" : ""}`
        : "No",
    ],
  ];

  return (
    <div className="space-y-4">
      <Hint>
        Double-check the basics. You can edit any of this after creating the
        startup.
      </Hint>
      <dl className="divide-y divide-border/60 border border-border/70">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[9rem_1fr]"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {props.description && (
        <div className="border border-border/70 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Description
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {props.description}
          </p>
        </div>
      )}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
