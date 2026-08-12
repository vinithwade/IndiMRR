"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/components/currency/currency-provider";
import type { RevenueSnapshot } from "@/lib/types";

export function MrrChart({
  snapshots,
  currency = "USD",
}: {
  snapshots: RevenueSnapshot[];
  currency?: string;
}) {
  const { convert, format, currency: display } = useCurrency();

  const data = snapshots.map((s) => ({
    date: new Date(s.captured_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    mrr: convert(s.mrr_cents, currency || s.currency) / 100,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center border border-dashed border-border text-sm text-muted-foreground">
        No revenue history yet
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8f070" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#c8f070" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#9aa89a", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#9aa89a", fontSize: 11 }}
            tickFormatter={(v) => format(Number(v) * 100, display, { compact: true })}
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: "#141916",
              border: "1px solid #273128",
              borderRadius: 0,
            }}
            formatter={(value) => [
              format(Number(value) * 100, display),
              "MRR",
            ]}
          />
          <Area
            type="monotone"
            dataKey="mrr"
            stroke="#c8f070"
            fill="url(#mrrFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
