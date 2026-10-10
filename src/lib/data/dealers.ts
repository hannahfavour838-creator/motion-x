import "server-only";
import { demoInventoryEnabled, isSupabaseConfigured } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase/server";
import { DEMO_SELLERS } from "@/lib/demo/inventory";
import type { DealerProfile, SellerSummary } from "@/lib/types";
import { isDemoDealerSlug, isDemoSellerId } from "@/lib/demo-mode";
import { builtInDemoActive, demoRecordsAllowed } from "./demo-fallback";
import { allDemoVehicles, demoSellerSummary, mapDealer, mapSeller } from "./mappers";

function demoDealers(): DealerProfile[] {
  const vehicles = allDemoVehicles();
  return DEMO_SELLERS.filter((s) => s.type === "dealer").map((s) => ({
    id: s.id,
    slug: s.slug!,
    businessName: s.displayName,
    logoUrl: null,
    description: s.description,
    countryCode: s.countryCode,
    region: s.region,
    city: s.city,
    addressLine: null,
    website: null,
    publicEmail: null,
    publicPhone: null,
    whatsapp: null,
    businessVerified: false,
    createdAt: "2026-09-01T00:00:00Z",
    listingCount: vehicles.filter((v) => v.seller.id === s.id && v.status === "active").length,
    isDemo: true,
  }));
}

/**
 * Dealer directory. `includeDemo` controls whether demonstration storefronts
 * appear; the homepage passes false so only genuine dealers are showcased.
 */
export async function listDealers({ includeDemo = false, limit = 48 } = {}): Promise<DealerProfile[]> {
  if (await builtInDemoActive()) return includeDemo && demoRecordsAllowed() ? demoDealers().slice(0, limit) : [];
  const supabase = await getPublicClient();
  const { data, error } = await supabase
    .from("dealer_profiles")
    .select("*, profile:profiles!dealer_profiles_id_fkey(is_demo, status)")
    .order("business_verified_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((r) => {
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return p?.status === "active" && (includeDemo ? demoInventoryEnabled() || !p?.is_demo : !p?.is_demo);
  });
  if (!rows.length) return [];
  const { data: counts } = await supabase.from("vehicles").select("seller_id").eq("status", "active").in("seller_id", rows.map((r) => r.id));
  const byId = new Map<string, number>();
  for (const c of counts ?? []) byId.set(c.seller_id, (byId.get(c.seller_id) ?? 0) + 1);
  return rows.map((r) => mapDealer(r, byId.get(r.id) ?? 0));
}

export async function getDealerBySlug(slug: string): Promise<DealerProfile | null> {
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return null;
  if ((await builtInDemoActive()) && (!isSupabaseConfigured() || isDemoDealerSlug(slug))) {
    return demoRecordsAllowed() ? demoDealers().find((d) => d.slug === slug) ?? null : null;
  }
  const supabase = await getPublicClient();
  const { data } = await supabase
    .from("dealer_profiles")
    .select("*, profile:profiles!dealer_profiles_id_fkey(is_demo, status)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const dealer = mapDealer(data);
  if (dealer.isDemo && !demoInventoryEnabled()) return null;
  const { count } = await supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("seller_id", data.id).eq("status", "active");
  return { ...dealer, listingCount: count ?? 0 };
}

export async function getPublicSeller(id: string): Promise<SellerSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if ((await builtInDemoActive()) && (!isSupabaseConfigured() || isDemoSellerId(id))) {
    const s = DEMO_SELLERS.find((x) => x.id === id);
    return s ? demoSellerSummary(s) : null;
  }
  const { data } = await (await getPublicClient())
    .from("profiles")
    .select("id, account_type, display_name, city, country_code, identity_verified_at, is_demo, created_at, dealer:dealer_profiles(slug, business_name, logo_url, business_verified_at, whatsapp, city, country_code)")
    .eq("id", id)
    .maybeSingle();
  return data ? mapSeller(data) : null;
}
