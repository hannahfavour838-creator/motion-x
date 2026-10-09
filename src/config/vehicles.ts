/**
 * Vehicle taxonomy shared by the UI, validation and the database enums.
 * Values are stored in the database exactly as written here.
 */
export const CONDITIONS = ["new", "used"] as const;
export const BODY_STYLES = [
  "coupe", "sedan", "suv", "hatchback", "estate", "convertible", "roadster", "pickup", "van", "mpv",
] as const;
export const TRANSMISSIONS = ["automatic", "manual", "dual_clutch", "single_speed"] as const;
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "plug_in_hybrid", "electric", "hydrogen"] as const;
export const DRIVETRAINS = ["rwd", "fwd", "awd", "4wd"] as const;
export const SEGMENTS = ["supercar", "luxury", "performance", "everyday", "classic"] as const;
export const SELLER_TYPES = ["dealer", "private"] as const;
export const LISTING_STATUSES = [
  "draft", "pending_review", "active", "paused", "sold", "rejected", "suspended",
] as const;

export type Condition = (typeof CONDITIONS)[number];
export type BodyStyle = (typeof BODY_STYLES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Drivetrain = (typeof DRIVETRAINS)[number];
export type Segment = (typeof SEGMENTS)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LABELS = {
  condition: { new: "New", used: "Used" } satisfies Record<Condition, string>,
  bodyStyle: {
    coupe: "Coupé", sedan: "Saloon / Sedan", suv: "SUV", hatchback: "Hatchback", estate: "Estate / Wagon",
    convertible: "Convertible", roadster: "Roadster", pickup: "Pickup", van: "Van", mpv: "MPV",
  } satisfies Record<BodyStyle, string>,
  transmission: {
    automatic: "Automatic", manual: "Manual", dual_clutch: "Dual-clutch", single_speed: "Single-speed",
  } satisfies Record<Transmission, string>,
  fuelType: {
    petrol: "Petrol", diesel: "Diesel", hybrid: "Hybrid", plug_in_hybrid: "Plug-in hybrid",
    electric: "Electric", hydrogen: "Hydrogen",
  } satisfies Record<FuelType, string>,
  drivetrain: { rwd: "Rear-wheel drive", fwd: "Front-wheel drive", awd: "All-wheel drive", "4wd": "Four-wheel drive" } satisfies Record<Drivetrain, string>,
  segment: {
    supercar: "Supercar", luxury: "Luxury", performance: "Performance", everyday: "Everyday", classic: "Classic & collectible",
  } satisfies Record<Segment, string>,
  sellerType: { dealer: "Dealership", private: "Private seller" } satisfies Record<SellerType, string>,
  status: {
    draft: "Draft", pending_review: "Pending review", active: "Live", paused: "Paused", sold: "Sold",
    rejected: "Changes required", suspended: "Suspended",
  } satisfies Record<ListingStatus, string>,
};

/** A non-exhaustive make catalogue used for suggestions; sellers may enter any make. */
export const POPULAR_MAKES = [
  "Aston Martin", "Audi", "Bentley", "BMW", "BYD", "Chevrolet", "Ferrari", "Ford", "Honda", "Hyundai",
  "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lotus", "Maserati", "Mazda", "McLaren",
  "Mercedes-Benz", "MINI", "Nissan", "Peugeot", "Polestar", "Porsche", "Range Rover", "Renault", "Rolls-Royce",
  "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

export interface CollectionDef {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  /** Marketplace filters this collection maps to. */
  filters: Record<string, string>;
  image: string;
}

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "supercars",
    title: "Supercars",
    kicker: "01",
    description: "Mid-engine drama, carbon and theatre. The most extreme machines on the platform.",
    filters: { segment: "supercar" },
    image: "/renders/collection-supercars.webp",
  },
  {
    slug: "luxury",
    title: "Luxury",
    kicker: "02",
    description: "Grand tourers, flagship saloons and limousines built around craftsmanship and calm.",
    filters: { segment: "luxury" },
    image: "/renders/collection-luxury.webp",
  },
  {
    slug: "performance",
    title: "Performance",
    kicker: "03",
    description: "Driver-focused coupés, hot saloons and track-capable everyday cars.",
    filters: { segment: "performance" },
    image: "/renders/collection-performance.webp",
  },
  {
    slug: "suvs",
    title: "SUVs",
    kicker: "04",
    description: "Commanding, capable and versatile — from family SUVs to luxury off-roaders.",
    filters: { body: "suv" },
    image: "/renders/collection-suvs.webp",
  },
  {
    slug: "electric",
    title: "Electric",
    kicker: "05",
    description: "Battery-electric vehicles across every segment, from city cars to hyper-EVs.",
    filters: { fuel: "electric" },
    image: "/renders/collection-electric.webp",
  },
  {
    slug: "everyday",
    title: "Everyday",
    kicker: "06",
    description: "Dependable, efficient and affordable cars for the way you really drive.",
    filters: { segment: "everyday" },
    image: "/renders/collection-everyday.webp",
  },
  {
    slug: "classics",
    title: "Classics & Collectibles",
    kicker: "07",
    description: "Modern classics and historic automobiles with a story worth preserving.",
    filters: { segment: "classic" },
    image: "/renders/collection-classics.webp",
  },
];

export function collectionHref(c: CollectionDef) {
  return `/cars?${new URLSearchParams(c.filters).toString()}`;
}
