"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const productLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/startups/new", label: "Add startup" },
  { href: "/auth/signup", label: "Create account" },
];

const resourceLinks = [
  { href: "/auth/login", label: "Log in" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace?sort=recent", label: "Recently listed" },
  { href: BRAND.github, label: "GitHub", external: true },
];

const companyLinks = [
  { href: `mailto:${BRAND.email}`, label: "Contact", external: true },
  { href: "/auth/signup", label: "Get started" },
  { href: "/auth/signup?role=buyer", label: "Sign up as buyer" },
  { href: "/auth/signup?role=seller", label: "Sign up as seller" },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.259 5.735L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function SiteFooter({ forceShow = false }: { forceShow?: boolean }) {
  const pathname = usePathname();
  if (!forceShow && pathname?.startsWith("/dashboard")) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto isolate overflow-hidden border-t border-border bg-[#0a0d0b]">
      {/* Solid base so page grid/content never shows through */}
      <div aria-hidden className="absolute inset-0 bg-[#0a0d0b]" />
      {/* Soft accent on top of solid fill — still opaque overall */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_100%,rgba(200,240,112,0.08),transparent_55%),radial-gradient(ellipse_50%_60%_at_100%_0%,rgba(125,211,160,0.05),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 select-none text-[clamp(5rem,18vw,11rem)] font-semibold leading-none tracking-tighter text-foreground/[0.04]"
      >
        MRR
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tracking-tight">
                {BRAND.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
                verified
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {BRAND.description} Stripe-backed numbers. Offers and chat on-platform.
              Closing stays yours.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Revenue verified via Stripe API — not screenshots
            </div>

            <div className="mt-8 flex items-center gap-2">
              <SocialLink href={BRAND.github} label="GitHub">
                <GithubIcon className="size-4" />
              </SocialLink>
              <SocialLink href={BRAND.twitter} label="X / Twitter">
                <XIcon className="size-3.5" />
              </SocialLink>
              <SocialLink href={BRAND.linkedin} label="LinkedIn">
                <LinkedinIcon className="size-4" />
              </SocialLink>
              <SocialLink href={`mailto:${BRAND.email}`} label="Email">
                <Mail className="size-4" />
              </SocialLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Resources" links={resourceLinks} />
            <FooterColumn title="Company" links={companyLinks} />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} {BRAND.name}. Built for founders who prove revenue.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <a
              href={BRAND.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              Open source on GitHub
              <ArrowUpRight className="size-3" />
            </a>
            <span className="hidden text-border sm:inline">·</span>
            <a
              href={`mailto:${BRAND.email}`}
              className="transition-colors hover:text-foreground"
            >
              {BRAND.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                {!link.href.startsWith("mailto:") && (
                  <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center border border-border/70 bg-card/40 text-muted-foreground transition-colors",
        "hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      )}
    >
      {children}
    </a>
  );
}
