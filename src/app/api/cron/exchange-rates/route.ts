import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { configuredProvider, fetchProviderRates, RATE_PROVIDERS } from "@/lib/rates";
import { createServiceClient } from "@/lib/supabase/admin";

/** Constant-time comparison (hashing first gives equal-length buffers). */
function sameSecret(given: string | null, expected: string): boolean {
  if (!given) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(given), h(expected));
}

/**
 * Daily exchange-rate refresh (see vercel.json). Protected by CRON_SECRET.
 * Stores rates in the database and recalculates USD reference prices used for
 * cross-currency search. Original asking prices are never modified.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provider = configuredProvider();
  if (!provider) return NextResponse.json({ skipped: "EXCHANGE_RATES_PROVIDER is not set" });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });

  const rates = await fetchProviderRates(provider);
  if (!rates) return NextResponse.json({ error: "Provider unavailable" }, { status: 502 });
  const fetched_at = new Date().toISOString();
  const rows = Object.entries(rates).filter(([c]) => c !== "USD").map(([currency, rate]) => ({ currency, rate, provider: RATE_PROVIDERS[provider].label, fetched_at }));
  const { error } = await supabase.from("exchange_rates").upsert(rows, { onConflict: "currency" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: updated, error: refreshError } = await supabase.rpc("refresh_price_references");
  if (refreshError) return NextResponse.json({ error: refreshError.message }, { status: 500 });
  revalidateTag("exchange-rates", "max");
  return NextResponse.json({ ok: true, provider, currencies: rows.length, listingsRepriced: updated });
}
