import { storagePublicUrl } from "@/lib/env";
import type { DealerProfile, SellerSummary, Vehicle, Vehicle3DAsset, VehicleImage } from "@/lib/types";
import { DEMO_SELLERS, DEMO_VEHICLES, demoPhotoCredit, demoPhotos, type DemoSeller, type DemoVehicle } from "@/lib/demo/inventory";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export const VEHICLE_SELECT = `
  *,
  images:vehicle_images(id, storage_path, url, alt, width, height, position),
  seller:profiles!vehicles_seller_id_fkey(
    id, account_type, display_name, city, country_code, identity_verified_at, is_demo, created_at,
    dealer:dealer_profiles(slug, business_name, logo_url, business_verified_at, whatsapp, city, country_code)
  )
`;

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function mapSeller(row: Row | null, isDemoVehicle = false): SellerSummary {
  const dealer = one(row?.dealer);
  const isDealer = row?.account_type === "dealer";
  return {
    id: row?.id ?? "",
    type: isDealer ? "dealer" : "private",
    displayName: isDealer && dealer?.business_name ? dealer.business_name : row?.display_name ?? "Seller",
    slug: isDealer ? dealer?.slug ?? null : null,
    city: dealer?.city ?? row?.city ?? null,
    countryCode: dealer?.country_code ?? row?.country_code ?? null,
    logoUrl: dealer?.logo_url ?? null,
    identityVerified: Boolean(row?.identity_verified_at),
    businessVerified: Boolean(dealer?.business_verified_at),
    memberSince: row?.created_at ?? new Date().toISOString(),
    whatsapp: isDealer ? dealer?.whatsapp ?? null : null,
    isDemo: Boolean(row?.is_demo) || isDemoVehicle,
  };
}

export function mapImage(row: Row, isDemo: boolean): VehicleImage {
  const representative = isDemo && !row.storage_path;
  return {
    id: row.id,
    url: row.storage_path ? storagePublicUrl("vehicle-images", row.storage_path) : row.url,
    alt: row.alt ?? "",
    width: row.width ?? null,
    height: row.height ?? null,
    position: row.position ?? 0,
    illustrative: representative,
    credit: representative && row.url ? demoPhotoCredit(row.url) : null,
  };
}

export function mapVehicle(row: Row): Vehicle {
  const isDemo = Boolean(row.is_demo);
  const images = ((row.images as Row[]) ?? []).map((i) => mapImage(i, isDemo)).sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    variant: row.variant,
    year: row.year,
    price: Number(row.price),
    currency: String(row.currency).trim(),
    priceReferenceUsd: row.price_reference_usd != null ? Number(row.price_reference_usd) : null,
    countryCode: String(row.country_code).trim(),
    region: row.region,
    city: row.city,
    mileage: row.mileage,
    mileageUnit: row.mileage_unit,
    condition: row.condition,
    bodyStyle: row.body_style,
    transmission: row.transmission,
    fuelType: row.fuel_type,
    drivetrain: row.drivetrain,
    segment: row.segment,
    exteriorColour: row.exterior_colour,
    interiorColour: row.interior_colour,
    engine: row.engine,
    powerHp: row.power_hp,
    doors: row.doors,
    seats: row.seats,
    description: row.description,
    status: row.status,
    isDemo,
    featured: Boolean(row.featured),
    inspectionAvailable: Boolean(row.inspection_available),
    inspectedAt: row.inspected_at,
    inspectionNote: row.inspection_note,
    historyCheckedAt: row.history_checked_at,
    historyCheckNote: row.history_check_note,
    assetId: row.asset_id,
    viewCount: row.view_count ?? 0,
    publishedAt: row.published_at,
    soldAt: row.sold_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rejectionReason: row.rejection_reason ?? null,
    images,
    seller: mapSeller(row.seller, isDemo),
  };
}

export function mapAsset(row: Row): Vehicle3DAsset {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    format: row.format,
    url: row.url,
    posterUrl: row.poster_url,
    fileBytes: row.file_bytes,
    credit: row.credit,
    license: row.license,
    licenseUrl: row.license_url,
    description: row.description,
    paintOptions: Array.isArray(row.paint_options) ? row.paint_options : [],
  };
}

export function mapDealer(row: Row, listingCount = 0): DealerProfile {
  const profile = one(row.profile);
  return {
    id: row.id,
    slug: row.slug,
    businessName: row.business_name,
    logoUrl: row.logo_url,
    description: row.description,
    countryCode: String(row.country_code).trim(),
    region: row.region,
    city: row.city,
    addressLine: row.address_line,
    website: row.website,
    publicEmail: row.public_email,
    publicPhone: row.public_phone,
    whatsapp: row.whatsapp,
    businessVerified: Boolean(row.business_verified_at),
    createdAt: row.created_at,
    listingCount,
    isDemo: Boolean(profile?.is_demo),
  };
}

// ── Demonstration inventory → domain objects ──────────────────────────────
const sellerByKey = new Map(DEMO_SELLERS.map((s) => [s.key, s]));

export function demoSellerSummary(s: DemoSeller): SellerSummary {
  return {
    id: s.id,
    type: s.type,
    displayName: s.displayName,
    slug: s.slug,
    city: s.city,
    countryCode: s.countryCode,
    logoUrl: null,
    identityVerified: false,
    businessVerified: false,
    memberSince: "2026-09-01T00:00:00Z",
    whatsapp: null,
    isDemo: true,
  };
}

export function demoVehicleSlug(v: DemoVehicle): string {
  const base = `${v.year} ${v.make} ${v.model} ${v.variant ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}-demo${v.id.slice(-2)}`;
}

export function mapDemoVehicle(v: DemoVehicle): Vehicle {
  const seller = sellerByKey.get(v.sellerKey)!;
  return {
    id: v.id,
    slug: demoVehicleSlug(v),
    make: v.make,
    model: v.model,
    variant: v.variant,
    year: v.year,
    price: v.price,
    currency: v.currency,
    priceReferenceUsd: null,
    countryCode: v.countryCode,
    region: v.region,
    city: v.city,
    mileage: v.mileage,
    mileageUnit: v.mileageUnit,
    condition: v.condition,
    bodyStyle: v.bodyStyle,
    transmission: v.transmission,
    fuelType: v.fuelType,
    drivetrain: v.drivetrain,
    segment: v.segment,
    exteriorColour: v.exteriorColour,
    interiorColour: v.interiorColour,
    engine: v.engine,
    powerHp: v.powerHp,
    doors: v.doors,
    seats: v.seats,
    description: v.description,
    status: v.sold ? "sold" : "active",
    isDemo: true,
    featured: Boolean(v.featured),
    inspectionAvailable: Boolean(v.inspectionAvailable),
    inspectedAt: null,
    inspectionNote: null,
    historyCheckedAt: null,
    historyCheckNote: null,
    assetId: null,
    viewCount: 0,
    publishedAt: v.publishedAt,
    soldAt: v.sold ? "2026-09-15T00:00:00Z" : null,
    createdAt: v.publishedAt,
    updatedAt: v.publishedAt,
    rejectionReason: null,
    images: demoPhotos(v).map((img, i) => ({
      id: `${v.id}-${i}`,
      url: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      position: i,
      illustrative: true,
      credit: img.credit,
    })),
    seller: demoSellerSummary(seller),
  };
}

let demoCache: Vehicle[] | null = null;
export function allDemoVehicles(): Vehicle[] {
  demoCache ??= DEMO_VEHICLES.map(mapDemoVehicle);
  return demoCache;
}
