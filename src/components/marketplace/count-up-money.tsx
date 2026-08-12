"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/components/currency/currency-provider";

export function CountUpMoney({
  cents,
  currency = "USD",
}: {
  cents: number;
  currency?: string;
}) {
  const { convert, format, currency: displayCurrency } = useCurrency();
  const target = convert(cents, currency);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  // `value` is already converted into display-currency cents
  return (
    <span className="metric-mono">{format(value, displayCurrency)}</span>
  );
}
