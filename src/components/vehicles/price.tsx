"use client";

import { usePrefs } from "@/components/providers/app-providers";
import { cn, formatPrice } from "@/lib/format";

/**
 * Original asking price (always shown, never altered) plus an optional,
 * clearly-labelled estimate in the visitor's chosen display currency.
 */
export function Price({
  amount, currency, locale, className, size = "md", showCode = true,
}: {
  amount: number; currency: string; locale?: string; className?: string; size?: "sm" | "md" | "lg"; showCode?: boolean;
}) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl md:text-4xl" };
  return (
    <div className={className}>
      <p className={cn("font-display font-normal tabular-nums tracking-tight text-white", sizes[size])}>
        {formatPrice(amount, currency, locale)}
        {showCode && <span className="ml-2 align-middle font-mono text-[0.6rem] tracking-[0.16em] text-dim">{currency}</span>}
      </p>
      <ConvertedPrice amount={amount} currency={currency} />
    </div>
  );
}

export function ConvertedPrice({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  const { rates, displayCurrency } = usePrefs();
  if (!rates || !displayCurrency || displayCurrency === currency) return null;
  const from = currency === "USD" ? 1 : rates[currency];
  const to = displayCurrency === "USD" ? 1 : rates[displayCurrency];
  if (!from || !to) return null;
  const converted = (amount / from) * to;
  return (
    <p className={cn("mt-1 text-xs text-muted", className)}>
      ≈ {formatPrice(converted, displayCurrency, "en-GB")} <span className="text-dim">estimate</span>
    </p>
  );
}
