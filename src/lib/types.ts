import type {
  BodyStyle, Condition, Drivetrain, FuelType, ListingStatus, Segment, SellerType, Transmission,
} from "@/config/vehicles";

export interface SellerSummary {
  id: string;
  type: SellerType;
  displayName: string;
  /** Dealer storefront slug (dealers only). */
  slug: string | null;
  city: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  identityVerified: boolean;
  businessVerified: boolean;
  memberSince: string;
  whatsapp: string | null;
  isDemo: boolean;
}

export interface VehicleImage {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  position: number;
  /** Illustrative render rather than a photograph of this exact vehicle. */
  illustrative: boolean;
}

export interface Vehicle3DAsset {
  id: string;
  slug: string;
  name: string;
  format: "glb" | "gltf";
  url: string;
  posterUrl: string | null;
  fileBytes: number | null;
  credit: string;
  license: string;
  licenseUrl: string | null;
  description: string | null;
  paintOptions: PaintOption[];
}

export interface PaintOption {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
}

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  currency: string;
  priceReferenceUsd: number | null;
  countryCode: string;
  region: string | null;
  city: string;
  mileage: number;
  mileageUnit: "km" | "mi";
  condition: Condition;
  bodyStyle: BodyStyle;
  transmission: Transmission;
  fuelType: FuelType;
  drivetrain: Drivetrain | null;
  segment: Segment;
  exteriorColour: string | null;
  interiorColour: string | null;
  engine: string | null;
  powerHp: number | null;
  doors: number | null;
  seats: number | null;
  description: string | null;
  status: ListingStatus;
  isDemo: boolean;
  featured: boolean;
  inspectionAvailable: boolean;
  inspectedAt: string | null;
  inspectionNote: string | null;
  historyCheckedAt: string | null;
  historyCheckNote: string | null;
  assetId: string | null;
  viewCount: number;
  publishedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
  rejectionReason: string | null;
  images: VehicleImage[];
  seller: SellerSummary;
}

export interface SearchFilters {
  q?: string;
  country?: string;
  city?: string;
  make?: string;
  minPrice?: number;
  maxPrice?: number;
  priceCurrency?: string;
  minYear?: number;
  maxYear?: number;
  condition?: Condition;
  minMileage?: number;
  maxMileage?: number;
  mileageUnit?: "km" | "mi";
  body?: BodyStyle;
  transmission?: Transmission;
  fuel?: FuelType;
  sellerType?: SellerType;
  segment?: Segment;
  availability?: "available" | "sold" | "all";
  has3d?: boolean;
  sort?: SortKey;
  page?: number;
}

export const SORT_KEYS = ["relevance", "newest", "price_asc", "price_desc", "year_desc", "year_asc", "mileage_asc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface SearchResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
  /** True when price filtering could only compare listings in the same currency. */
  priceFilterSameCurrencyOnly: boolean;
}

export interface DealerProfile {
  id: string;
  slug: string;
  businessName: string;
  logoUrl: string | null;
  description: string | null;
  countryCode: string;
  region: string | null;
  city: string;
  addressLine: string | null;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  whatsapp: string | null;
  businessVerified: boolean;
  createdAt: string;
  listingCount: number;
  isDemo: boolean;
}

export type ExchangeRates = Record<string, number>; // units per USD

export interface ActionResult<T = undefined> {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: T;
}
