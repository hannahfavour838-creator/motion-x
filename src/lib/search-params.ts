import {
  BODY_STYLES, CONDITIONS, FUEL_TYPES, LABELS, SEGMENTS, SELLER_TYPES, TRANSMISSIONS,
  type BodyStyle, type Condition, type FuelType, type Segment, type SellerType, type Transmission,
} from "@/config/vehicles";
import { CURRENCIES, countryName, getMarket } from "@/config/markets";
import { SORT_KEYS, type SearchFilters, type SortKey } from "@/lib/types";

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string): string | undefined {
  const raw = params instanceof URLSearchParams ? params.get(key) ?? undefined : params[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  const t = v?.trim();
  return t ? t.slice(0, 120) : undefined;
}

function num(params: Params, key: string, min: number, max: number): number | undefined {
  const v = get(params, key);
  if (!v) return undefined;
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function oneOf<T extends string>(params: Params, key: string, allowed: readonly T[]): T | undefined {
  const v = get(params, key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** Parse and validate marketplace filters from URL search params. Unknown values are dropped. */
export function parseFilters(params: Params): SearchFilters {
  const country = get(params, "country")?.toUpperCase();
  const cur = get(params, "cur")?.toUpperCase();
  return {
    q: get(params, "q"),
    country: country && /^[A-Z]{2}$/.test(country) ? country : undefined,
    city: get(params, "city"),
    make: get(params, "make"),
    minPrice: num(params, "min_price", 0, 1e11),
    maxPrice: num(params, "max_price", 0, 1e11),
    priceCurrency: cur && (CURRENCIES as readonly string[]).includes(cur) ? cur : undefined,
    minYear: num(params, "min_year", 1886, 2100),
    maxYear: num(params, "max_year", 1886, 2100),
    condition: oneOf<Condition>(params, "condition", CONDITIONS),
    minMileage: num(params, "min_mileage", 0, 3_000_000),
    maxMileage: num(params, "max_mileage", 0, 3_000_000),
    mileageUnit: oneOf(params, "unit", ["km", "mi"] as const),
    body: oneOf<BodyStyle>(params, "body", BODY_STYLES),
    transmission: oneOf<Transmission>(params, "transmission", TRANSMISSIONS),
    fuel: oneOf<FuelType>(params, "fuel", FUEL_TYPES),
    sellerType: oneOf<SellerType>(params, "seller", SELLER_TYPES),
    segment: oneOf<Segment>(params, "segment", SEGMENTS),
    availability: oneOf(params, "availability", ["available", "sold", "all"] as const),
    has3d: get(params, "has3d") === "1" ? true : undefined,
    sort: oneOf<SortKey>(params, "sort", SORT_KEYS),
    page: num(params, "page", 1, 10_000),
  };
}

const KEY_MAP: Record<keyof SearchFilters, string> = {
  q: "q", country: "country", city: "city", make: "make", minPrice: "min_price", maxPrice: "max_price",
  priceCurrency: "cur", minYear: "min_year", maxYear: "max_year", condition: "condition", minMileage: "min_mileage", maxMileage: "max_mileage",
  mileageUnit: "unit", body: "body", transmission: "transmission", fuel: "fuel", sellerType: "seller",
  segment: "segment", availability: "availability", has3d: "has3d", sort: "sort", page: "page",
};

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters) as [keyof SearchFilters, unknown][]) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    if (k === "page" && v === 1) continue;
    sp.set(KEY_MAP[k], k === "has3d" ? "1" : String(v));
  }
  return sp;
}

export function filtersHref(filters: SearchFilters, base = "/cars"): string {
  const qs = filtersToSearchParams(filters).toString();
  return qs ? `${base}?${qs}` : base;
}

export interface ActiveFilterChip {
  key: keyof SearchFilters | "price" | "year";
  label: string;
  href: string;
}

/** Human-readable removable chips for each active filter. */
export function activeFilterChips(filters: SearchFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const without = (...keys: (keyof SearchFilters)[]) => {
    const next: SearchFilters = { ...filters, page: undefined };
    for (const k of keys) delete next[k];
    return filtersHref(next);
  };
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, href: without("q") });
  if (filters.make) chips.push({ key: "make", label: filters.make, href: without("make") });
  if (filters.country) chips.push({ key: "country", label: countryName(filters.country), href: without("country", "city") });
  if (filters.city) chips.push({ key: "city", label: filters.city, href: without("city") });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const cur = filters.priceCurrency || "";
    const lo = filters.minPrice !== undefined ? filters.minPrice.toLocaleString("en") : "0";
    const hi = filters.maxPrice !== undefined ? filters.maxPrice.toLocaleString("en") : "any";
    chips.push({ key: "price", label: `${cur} ${lo} – ${hi}`.trim(), href: without("minPrice", "maxPrice", "priceCurrency") });
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    chips.push({ key: "year", label: `${filters.minYear ?? "Any"} – ${filters.maxYear ?? "Any"}`, href: without("minYear", "maxYear") });
  }
  if (filters.condition) chips.push({ key: "condition", label: LABELS.condition[filters.condition], href: without("condition") });
  if (filters.minMileage !== undefined || filters.maxMileage !== undefined) {
    const u = filters.mileageUnit ?? "km";
    const label = filters.minMileage !== undefined && filters.maxMileage !== undefined
      ? `${filters.minMileage.toLocaleString("en")}–${filters.maxMileage.toLocaleString("en")} ${u}`
      : filters.maxMileage !== undefined ? `≤ ${filters.maxMileage.toLocaleString("en")} ${u}` : `≥ ${filters.minMileage!.toLocaleString("en")} ${u}`;
    chips.push({ key: "maxMileage", label, href: without("minMileage", "maxMileage", "mileageUnit") });
  }
  if (filters.body) chips.push({ key: "body", label: LABELS.bodyStyle[filters.body], href: without("body") });
  if (filters.transmission) chips.push({ key: "transmission", label: LABELS.transmission[filters.transmission], href: without("transmission") });
  if (filters.fuel) chips.push({ key: "fuel", label: LABELS.fuelType[filters.fuel], href: without("fuel") });
  if (filters.sellerType) chips.push({ key: "sellerType", label: LABELS.sellerType[filters.sellerType], href: without("sellerType") });
  if (filters.segment) chips.push({ key: "segment", label: LABELS.segment[filters.segment], href: without("segment") });
  if (filters.availability && filters.availability !== "available") chips.push({ key: "availability", label: filters.availability === "sold" ? "Sold" : "Available & sold", href: without("availability") });
  if (filters.has3d) chips.push({ key: "has3d", label: "3D showroom", href: without("has3d") });
  return chips;
}

const SEGMENT_NOUN: Record<string, string> = {
  supercar: "Supercars", luxury: "Luxury cars", performance: "Performance cars", everyday: "Everyday cars", classic: "Classic & collectible cars",
};
const BODY_NOUN: Record<string, string> = {
  coupe: "Coupés", sedan: "Saloons", suv: "SUVs", hatchback: "Hatchbacks", estate: "Estates", convertible: "Convertibles",
  roadster: "Roadsters", pickup: "Pickups", van: "Vans", mpv: "MPVs",
};

/** A readable page heading for the current filters, e.g. "Electric SUVs in Germany". */
export function describeFilters(filters: SearchFilters): string {
  const adjectives: string[] = [];
  if (filters.condition === "new") adjectives.push("New");
  if (filters.fuel) adjectives.push(LABELS.fuelType[filters.fuel]);
  if (filters.make) adjectives.push(filters.make);
  let noun = "Cars";
  if (filters.body) noun = BODY_NOUN[filters.body];
  else if (filters.segment) noun = SEGMENT_NOUN[filters.segment];
  if (filters.body && filters.segment) adjectives.unshift(LABELS.segment[filters.segment]);
  let s = [...adjectives, adjectives.length && noun === "Cars" ? "cars" : noun].join(" ");
  if (filters.country) s += ` in ${getMarket(filters.country)?.name ?? filters.country}`;
  if (filters.availability === "sold") s = `Sold: ${s}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
