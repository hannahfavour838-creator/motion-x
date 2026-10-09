"use client";

import { usePrefs } from "@/components/providers/app-providers";

/** Display-currency preference. Hidden when no exchange-rate provider is configured. */
export function CurrencySwitcher({ className }: { className?: string }) {
  const { displayCurrencies, displayCurrency, setDisplayCurrency, rateAttribution } = usePrefs();
  if (!displayCurrencies.length) return null;
  return (
    <div className={className}>
      <label className="flex items-center gap-3 text-xs text-dim">
        <span className="font-mono uppercase tracking-[0.16em]">Show estimates in</span>
        <select
          value={displayCurrency ?? ""}
          onChange={(e) => setDisplayCurrency(e.target.value || null)}
          className="h-8 cursor-pointer rounded-xs border border-line bg-charcoal px-2 font-mono text-[0.7rem] text-silver focus:border-electric focus:outline-none"
        >
          <option value="">Original only</option>
          {displayCurrencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      {rateAttribution && <p className="mt-1.5 text-[0.65rem] text-dim">{rateAttribution}. Converted values are estimates.</p>}
    </div>
  );
}
