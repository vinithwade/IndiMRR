import { NextResponse } from "next/server";
import { FALLBACK_RATES_USD } from "@/lib/currency/constants";
import type { FxPayload } from "@/lib/currency/convert";

let cache: { payload: FxPayload; expiresAt: number } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return NextResponse.json(cache.payload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates) {
      throw new Error("Invalid FX payload");
    }

    const payload: FxPayload = {
      base: "USD",
      rates: { USD: 1, ...data.rates },
      fetchedAt: new Date().toISOString(),
      source: "live",
    };
    cache = { payload, expiresAt: now + 60 * 60 * 1000 };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    const payload: FxPayload = {
      base: "USD",
      rates: { ...FALLBACK_RATES_USD },
      fetchedAt: new Date().toISOString(),
      source: "fallback",
    };
    cache = { payload, expiresAt: now + 15 * 60 * 1000 };
    return NextResponse.json(payload);
  }
}
