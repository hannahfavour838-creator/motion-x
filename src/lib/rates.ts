import "server-only";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type { ExchangeRates } from "@/lib/types";

/**
 * Exchange-rate providers. Rates are only used to show clearly-labelled
 * ESTIMATES next to the original asking price, and to compare prices across
 * currencies in search. No rates are ever hardcoded.
 *
 * EXCHANGE_RATES_PROVIDER = "open-er-api" | "frankfurter" | (unset = disabled)
 */
export const RATE_PROVIDERS = {
  "open-er-api": {
    label: "ExchangeRate-API (open access)",
    attribution: "Rates by ExchangeRate-API",
    url: "https://open.er-api.com/v6/latest/USD",
    parse: (json: { result?: string; rates?: Record<string, number> }) => (json.result === "success" ? json.rates ?? null : null),
  },
  frankfurter: {
    label: "Frankfurter (European Central Bank reference rates)",
    attribution: "Rates from the European Central Bank via Frankfurter",
    url: "https://api.frankfurter.app/latest?from=USD",
    parse: (json: { rates?: Record<string, number> }) => (json.rates ? { USD: 1, ...json.rates } : null),
  },
} as const;

export type RateProviderId = keyof typeof RATE_PROVIDERS;

export function configuredProvider(): RateProviderId | null {
  const id = process.env.EXCHANGE_RATES_PROVIDER as RateProviderId | undefined;
  return id && id in RATE_PROVIDERS ? id : null;
}

export async function fetchProviderRates(id: RateProviderId): Promise<ExchangeRates | null> {
  const provider = RATE_PROVIDERS[id];
  try {
    const res = await fetch(provider.url, { next: { revalidate: 43_200 } });
    if (!res.ok) return null;
    const rates = provider.parse(await res.json());
    if (!rates) return null;
    const clean: ExchangeRates = {};
    for (const [k, v] of Object.entries(rates)) if (/^[A-Z]{3}$/.test(k) && typeof v === "number" && v > 0) clean[k] = v;
    clean.USD = 1;
    return clean;
  } catch {
    return null;
  }
}

const readStoredRates = unstable_cache(
  async (): Promise<ExchangeRates | null> => {
    const { data, error } = await createPublicClient()
      .from("exchange_rates")
      .select("currency, rate, fetched_at")
      .gt("fetched_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
    if (error || !data?.length) return null;
    const rates: ExchangeRates = { USD: 1 };
    for (const r of data) rates[String(r.currency).trim()] = Number(r.rate);
    return rates;
  },
  ["exchange-rates"],
  { revalidate: 3600, tags: ["exchange-rates"] },
);

export interface RatesInfo {
  rates: ExchangeRates;
  attribution: string;
}

/** Current rates (units per USD), or null when no provider is configured/available. */
export async function getExchangeRates(): Promise<RatesInfo | null> {
  const provider = configuredProvider();
  if (!provider) return null;
  if (isSupabaseConfigured()) {
    try {
      const stored = await readStoredRates();
      if (stored) return { rates: stored, attribution: RATE_PROVIDERS[provider].attribution };
    } catch {
      // fall through to provider
    }
  }
  const live = await fetchProviderRates(provider);
  return live ? { rates: live, attribution: RATE_PROVIDERS[provider].attribution } : null;
}

export function toUsd(amount: number, currency: string, rates: ExchangeRates | null | undefined): number | null {
  if (currency === "USD") return amount;
  const r = rates?.[currency];
  return r ? amount / r : null;
}
