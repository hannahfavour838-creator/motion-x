import "server-only";
import { cache } from "react";
import { PAGE_SIZE } from "@/config/site";
import { POPULAR_MAKES } from "@/config/vehicles";
import { demoInventoryEnabled, isSupabaseConfigured } from "@/lib/env";
import { getExchangeRates, toUsd } from "@/lib/rates";
import { createClient, getPublicClient } from "@/lib/supabase/server";
import type { ExchangeRates, SearchFilters, SearchResult, Vehicle } from "@/lib/types";
import { isDemoSellerId, isDemoVehicleId } from "@/lib/demo-mode";
import { builtInDemoActive } from "./demo-fallback";
import { allDemoVehicles, mapVehicle, VEHICLE_SELECT } from "./mappers";

const MI_TO_KM = 1.609344;

function mileageKm(v: Pick<Vehicle, "mileage" | "mileageUnit">) {
  return v.mileageUnit === "mi" ? Math.round(v.mileage * MI_TO_KM) : v.mileage;
}

function orderByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const pos = new Map(ids.map((id, i) => [id, i]));
  return [...rows].sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
}

// ── Demonstration backend (no database configured) ───────────────────────
function demoSearch(filters: SearchFilters, rates: ExchangeRates | null): { list: Vehicle[] } {
  const terms = (filters.q ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, " ").split(/\s+/).filter(Boolean);
  const cur = filters.priceCurrency ?? "USD";
  const maxKm = filters.maxMileage !== undefined ? filters.maxMileage * (filters.mileageUnit === "mi" ? MI_TO_KM : 1) : undefined;
  const minKm = filters.minMileage !== undefined ? filters.minMileage * (filters.mileageUnit === "mi" ? MI_TO_KM : 1) : undefined;
  const availability = filters.availability ?? "available";
  const scored: { v: Vehicle; score: number }[] = [];

  for (const v of allDemoVehicles()) {
    if (availability === "available" && v.status !== "active") continue;
    if (availability === "sold" && v.status !== "sold") continue;
    let score = 0;
    if (terms.length) {
      const strong = `${v.make} ${v.model}`.toLowerCase();
      const hay = `${strong} ${v.variant ?? ""} ${v.year} ${v.bodyStyle} ${v.fuelType} ${v.exteriorColour ?? ""} ${v.description ?? ""}`.toLowerCase();
      const words = hay.split(/[^\p{L}\p{N}]+/u);
      if (!terms.every((t) => words.some((w) => w.startsWith(t)))) continue;
      for (const t of terms) if (strong.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(t))) score += 1;
    }
    if (filters.country && v.countryCode !== filters.country) continue;
    if (filters.city && v.city.toLowerCase() !== filters.city.toLowerCase()) continue;
    if (filters.make && v.make.toLowerCase() !== filters.make.toLowerCase()) continue;
    if (filters.minYear !== undefined && v.year < filters.minYear) continue;
    if (filters.maxYear !== undefined && v.year > filters.maxYear) continue;
    if (filters.condition && v.condition !== filters.condition) continue;
    if (maxKm !== undefined && mileageKm(v) > maxKm) continue;
    if (minKm !== undefined && mileageKm(v) < minKm) continue;
    if (filters.body && v.bodyStyle !== filters.body) continue;
    if (filters.transmission && v.transmission !== filters.transmission) continue;
    if (filters.fuel && v.fuelType !== filters.fuel) continue;
    if (filters.sellerType && v.seller.type !== filters.sellerType) continue;
    if (filters.segment && v.segment !== filters.segment) continue;
    if (filters.has3d && !v.assetId) continue;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      let compare: number | null = null;
      if (v.currency === cur) compare = v.price;
      else {
        const usd = toUsd(v.price, v.currency, rates);
        const rate = cur === "USD" ? 1 : rates?.[cur];
        if (usd !== null && rate) compare = usd * rate;
      }
      if (compare === null) continue;
      if (filters.minPrice !== undefined && compare < filters.minPrice) continue;
      if (filters.maxPrice !== undefined && compare > filters.maxPrice) continue;
    }
    scored.push({ v, score });
  }

  const sort = filters.sort ?? "relevance";
  const usd = (v: Vehicle) => toUsd(v.price, v.currency, rates);
  const published = (v: Vehicle) => (v.publishedAt ? Date.parse(v.publishedAt) : 0);
  scored.sort((a, b) => {
    switch (sort) {
      case "price_asc":
      case "price_desc": {
        const dir = sort === "price_asc" ? 1 : -1;
        const ua = usd(a.v), ub = usd(b.v);
        if (ua !== null && ub !== null) return (ua - ub) * dir;
        if (ua !== null) return -1;
        if (ub !== null) return 1;
        if (a.v.currency !== b.v.currency) return a.v.currency.localeCompare(b.v.currency);
        return (a.v.price - b.v.price) * dir;
      }
      case "year_desc": return b.v.year - a.v.year || published(b.v) - published(a.v);
      case "year_asc": return a.v.year - b.v.year || published(b.v) - published(a.v);
      case "mileage_asc": return mileageKm(a.v) - mileageKm(b.v);
      case "newest": return published(b.v) - published(a.v);
      default:
        return b.score - a.score || Number(b.v.featured) - Number(a.v.featured) || published(b.v) - published(a.v);
    }
  });
  return { list: scored.map((s) => s.v) };
}

function priceFilterLimited(filters: SearchFilters, rates: ExchangeRates | null): boolean {
  if (filters.minPrice === undefined && filters.maxPrice === undefined) return false;
  const cur = filters.priceCurrency ?? "USD";
  return !rates || (cur !== "USD" && !rates[cur]);
}

// ── Public API ───────────────────────────────────────────────────────────

export async function searchVehicles(filters: SearchFilters): Promise<SearchResult> {
  const page = filters.page ?? 1;
  const ratesInfo = await getExchangeRates();
  const rates = ratesInfo?.rates ?? null;
  const limited = priceFilterLimited(filters, rates);

  if (await builtInDemoActive()) {
    const { list } = demoSearch(filters, rates);
    return {
      vehicles: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: list.length,
      page,
      pageSize: PAGE_SIZE,
      priceFilterSameCurrencyOnly: limited,
    };
  }

  const supabase = await getPublicClient();
  const maxKm = filters.maxMileage !== undefined ? Math.round(filters.maxMileage * (filters.mileageUnit === "mi" ? MI_TO_KM : 1)) : null;
  const { data, error } = await supabase.rpc("search_vehicles", {
    p_q: filters.q ?? null,
    p_country: filters.country ?? null,
    p_city: filters.city ?? null,
    p_make: filters.make ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_price_currency: filters.minPrice !== undefined || filters.maxPrice !== undefined ? filters.priceCurrency ?? "USD" : null,
    p_min_year: filters.minYear ?? null,
    p_max_year: filters.maxYear ?? null,
    p_condition: filters.condition ?? null,
    p_max_mileage_km: maxKm,
    p_min_mileage_km: filters.minMileage !== undefined ? Math.round(filters.minMileage * (filters.mileageUnit === "mi" ? MI_TO_KM : 1)) : null,
    p_body: filters.body ?? null,
    p_transmission: filters.transmission ?? null,
    p_fuel: filters.fuel ?? null,
    p_seller_type: filters.sellerType ?? null,
    p_segment: filters.segment ?? null,
    p_availability: filters.availability ?? "available",
    p_has_3d: filters.has3d ?? null,
    p_include_demo: demoInventoryEnabled(),
    p_sort: filters.sort ?? "relevance",
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  const rows = (data ?? []) as { vehicle_id: string; total_count: number }[];
  const ids = rows.map((r) => r.vehicle_id);
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  if (!ids.length) {
    // Page beyond the end still needs the total for pagination.
    return { vehicles: [], total, page, pageSize: PAGE_SIZE, priceFilterSameCurrencyOnly: limited };
  }
  const { data: vehicles, error: vErr } = await supabase.from("vehicles").select(VEHICLE_SELECT).in("id", ids);
  if (vErr) throw new Error(`Search failed: ${vErr.message}`);
  return {
    vehicles: orderByIds((vehicles ?? []).map(mapVehicle), ids),
    total,
    page,
    pageSize: PAGE_SIZE,
    priceFilterSameCurrencyOnly: limited,
  };
}

/**
 * A vehicle by slug. Uses the visitor's session so owners and admins can
 * preview listings that are not yet public; RLS decides visibility.
 */
export const getVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  if (!/^[a-z0-9-]{3,200}$/.test(slug)) return null;
  if (await builtInDemoActive()) {
    const demo = allDemoVehicles().find((v) => v.slug === slug);
    if (demo || !isSupabaseConfigured()) return demo ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("vehicles").select(VEHICLE_SELECT).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  const v = mapVehicle(data);
  if (v.isDemo && !demoInventoryEnabled()) return null;
  return v;
});

export async function getFeaturedVehicles(limit = 6): Promise<Vehicle[]> {
  if (await builtInDemoActive()) {
    return demoSearch({ sort: "relevance" }, null).list.filter((v) => v.featured).concat(
      demoSearch({ sort: "newest" }, null).list.filter((v) => !v.featured),
    ).slice(0, limit);
  }
  let q = (await getPublicClient()).from("vehicles").select(VEHICLE_SELECT).eq("status", "active")
    .order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(limit);
  if (!demoInventoryEnabled()) q = q.eq("is_demo", false);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapVehicle);
}

export async function getSimilarVehicles(v: Vehicle, limit = 4): Promise<Vehicle[]> {
  if (await builtInDemoActive()) {
    const all = allDemoVehicles().filter((x) => x.id !== v.id && x.status === "active");
    const rank = (x: Vehicle) => (x.segment === v.segment ? 2 : 0) + (x.bodyStyle === v.bodyStyle ? 1 : 0) + (x.make === v.make ? 1 : 0);
    return all.sort((a, b) => rank(b) - rank(a)).slice(0, limit);
  }
  let q = (await getPublicClient()).from("vehicles").select(VEHICLE_SELECT).eq("status", "active").neq("id", v.id)
    .or(`segment.eq.${v.segment},body_style.eq.${v.bodyStyle}`).order("published_at", { ascending: false }).limit(limit);
  if (!demoInventoryEnabled()) q = q.eq("is_demo", false);
  const { data } = await q;
  return (data ?? []).map(mapVehicle);
}

export async function getVehiclesByIds(ids: string[]): Promise<Vehicle[]> {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 4);
  if (!clean.length) return [];
  if (await builtInDemoActive()) {
    if (!isSupabaseConfigured() || clean.every(isDemoVehicleId)) return orderByIds(allDemoVehicles().filter((v) => clean.includes(v.id)), clean);
  }
  const { data } = await (await getPublicClient()).from("vehicles").select(VEHICLE_SELECT).in("id", clean);
  return orderByIds((data ?? []).map(mapVehicle), clean);
}

export async function getSellerPublicListings(sellerId: string, limit = 48): Promise<Vehicle[]> {
  if ((await builtInDemoActive()) && (!isSupabaseConfigured() || isDemoSellerId(sellerId))) {
    return allDemoVehicles().filter((v) => v.seller.id === sellerId && v.status === "active").slice(0, limit);
  }
  const { data } = await (await getPublicClient()).from("vehicles").select(VEHICLE_SELECT)
    .eq("seller_id", sellerId).in("status", ["active", "sold"]).order("published_at", { ascending: false }).limit(limit);
  return (data ?? []).map(mapVehicle);
}

/** Makes present in public inventory, merged with a suggestion list. */
export async function getMakeSuggestions(): Promise<string[]> {
  const set = new Set<string>(POPULAR_MAKES);
  if (await builtInDemoActive()) {
    for (const v of allDemoVehicles()) set.add(v.make);
  } else {
    const { data } = await (await getPublicClient()).from("vehicles").select("make").eq("status", "active").limit(1000);
    for (const r of data ?? []) set.add(r.make);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function countPublicListings(): Promise<number> {
  if (await builtInDemoActive()) return allDemoVehicles().filter((v) => v.status === "active").length;
  let q = (await getPublicClient()).from("vehicles").select("id", { count: "exact", head: true }).eq("status", "active");
  if (!demoInventoryEnabled()) q = q.eq("is_demo", false);
  const { count } = await q;
  return count ?? 0;
}

export async function getVehicleCountsByCountry(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (await builtInDemoActive()) {
    for (const v of allDemoVehicles()) if (v.status === "active") counts[v.countryCode] = (counts[v.countryCode] ?? 0) + 1;
    return counts;
  }
  let q = (await getPublicClient()).from("vehicles").select("country_code").eq("status", "active").limit(5000);
  if (!demoInventoryEnabled()) q = q.eq("is_demo", false);
  const { data } = await q;
  for (const r of data ?? []) counts[String(r.country_code).trim()] = (counts[String(r.country_code).trim()] ?? 0) + 1;
  return counts;
}
