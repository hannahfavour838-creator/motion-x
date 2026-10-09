/**
 * DEMONSTRATION INVENTORY
 * ───────────────────────
 * These listings exist so the marketplace can be explored before real sellers
 * join. They are NOT vehicles for sale. Every record is flagged `isDemo`, the
 * UI labels them as demonstration listings, and their images are illustrative
 * studio renders produced by tools/studio-renderer — not photographs of the
 * vehicle described. Prices are indicative only.
 *
 * The same data is written to supabase/seed.sql by `npm run seed:generate`
 * for development databases. Never load it into production.
 */
import type { BodyStyle, Condition, Drivetrain, FuelType, Segment, Transmission } from "@/config/vehicles";

export interface DemoSeller {
  key: string;
  id: string;
  type: "dealer" | "private";
  displayName: string;
  slug: string | null;
  countryCode: string;
  city: string;
  region: string | null;
  description: string | null;
}

export interface DemoVehicle {
  id: string;
  sellerKey: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  currency: string;
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
  exteriorColour: string;
  interiorColour: string | null;
  engine: string | null;
  powerHp: number | null;
  doors: number | null;
  seats: number | null;
  description: string;
  featured?: boolean;
  inspectionAvailable?: boolean;
  sold?: boolean;
  publishedAt: string;
  render: { preset: string; color: string; rimColor?: string; blackRoof?: boolean; spokes?: number; caliper?: string };
}

const uuid = (n: number, prefix = "d0") => `${prefix}000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

export const DEMO_SELLERS: DemoSeller[] = [
  { key: "london", id: uuid(1, "de"), type: "dealer", displayName: "Demonstration Dealer — London", slug: "demo-dealer-london", countryCode: "GB", city: "London", region: "Greater London", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "dubai", id: uuid(2, "de"), type: "dealer", displayName: "Demonstration Dealer — Dubai", slug: "demo-dealer-dubai", countryCode: "AE", city: "Dubai", region: "Dubai", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "munich", id: uuid(3, "de"), type: "dealer", displayName: "Demonstration Dealer — Munich", slug: "demo-dealer-munich", countryCode: "DE", city: "Munich", region: "Bavaria", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "la", id: uuid(4, "de"), type: "dealer", displayName: "Demonstration Dealer — Los Angeles", slug: "demo-dealer-los-angeles", countryCode: "US", city: "Los Angeles", region: "California", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "melbourne", id: uuid(5, "de"), type: "dealer", displayName: "Demonstration Dealer — Melbourne", slug: "demo-dealer-melbourne", countryCode: "AU", city: "Melbourne", region: "Victoria", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "tokyo", id: uuid(6, "de"), type: "dealer", displayName: "Demonstration Dealer — Tokyo", slug: "demo-dealer-tokyo", countryCode: "JP", city: "Tokyo", region: "Tokyo", description: "A demonstration dealership used to preview MOTION X dealer storefronts. Not a real business." },
  { key: "p1", id: uuid(11, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "FR", city: "Paris", region: "Île-de-France", description: null },
  { key: "p2", id: uuid(12, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "US", city: "Austin", region: "Texas", description: null },
  { key: "p3", id: uuid(13, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "GB", city: "Manchester", region: "Greater Manchester", description: null },
  { key: "p4", id: uuid(14, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "SE", city: "Stockholm", region: null, description: null },
  { key: "p5", id: uuid(15, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "CA", city: "Toronto", region: "Ontario", description: null },
  { key: "p6", id: uuid(16, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "NG", city: "Lagos", region: "Lagos", description: null },
  { key: "p7", id: uuid(17, "de"), type: "private", displayName: "Demonstration private seller", slug: null, countryCode: "ZA", city: "Johannesburg", region: "Gauteng", description: null },
];

const DEMO_NOTE = "This is a demonstration listing created to preview MOTION X. It is not a real vehicle for sale.";

export const DEMO_VEHICLES: DemoVehicle[] = [
  {
    id: uuid(1), sellerKey: "london", make: "Porsche", model: "911", variant: "Carrera S", year: 2021, price: 98500, currency: "GBP",
    countryCode: "GB", region: "Greater London", city: "London", mileage: 14200, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "rwd", segment: "performance", exteriorColour: "GT Silver Metallic",
    interiorColour: "Black leather", engine: "3.0 L twin-turbo flat-six", powerHp: 450, doors: 2, seats: 4, featured: true, inspectionAvailable: true,
    description: `${DEMO_NOTE}\n\nA rear-engined sports coupé specified with sports exhaust, adaptive dampers and a full service record (illustrative).`,
    publishedAt: "2026-10-06T09:12:00Z", render: { preset: "sportscoupe", color: "#b9bdc3", spokes: 10 },
  },
  {
    id: uuid(2), sellerKey: "dubai", make: "Ferrari", model: "F8 Tributo", variant: null, year: 2020, price: 1050000, currency: "AED",
    countryCode: "AE", region: "Dubai", city: "Dubai", mileage: 9800, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "rwd", segment: "supercar", exteriorColour: "Rosso Corsa",
    interiorColour: "Nero leather", engine: "3.9 L twin-turbo V8", powerHp: 710, doors: 2, seats: 2, featured: true,
    description: `${DEMO_NOTE}\n\nMid-engined V8 berlinetta. GCC specification with carbon-fibre interior trim (illustrative).`,
    publishedAt: "2026-10-05T15:40:00Z", render: { preset: "supercar", color: "#a5101a", caliper: "#d4b13a" },
  },
  {
    id: uuid(3), sellerKey: "munich", make: "Lamborghini", model: "Huracán", variant: "EVO", year: 2021, price: 239000, currency: "EUR",
    countryCode: "DE", region: "Bavaria", city: "Munich", mileage: 11500, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "awd", segment: "supercar", exteriorColour: "Verde metallic",
    interiorColour: "Nero Ade", engine: "5.2 L naturally aspirated V10", powerHp: 640, doors: 2, seats: 2, featured: true,
    description: `${DEMO_NOTE}\n\nNaturally aspirated V10 with all-wheel drive and rear-wheel steering (illustrative).`,
    publishedAt: "2026-10-04T10:05:00Z", render: { preset: "supercar", color: "#4f8a2a" },
  },
  {
    id: uuid(4), sellerKey: "la", make: "McLaren", model: "720S", variant: "Performance", year: 2019, price: 239900, currency: "USD",
    countryCode: "US", region: "California", city: "Los Angeles", mileage: 8900, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "rwd", segment: "supercar", exteriorColour: "Papaya orange",
    interiorColour: "Carbon black Alcantara", engine: "4.0 L twin-turbo V8", powerHp: 710, doors: 2, seats: 2,
    description: `${DEMO_NOTE}\n\nCarbon-tub supercar with dihedral doors and track telemetry (illustrative).`,
    publishedAt: "2026-10-03T18:22:00Z", render: { preset: "supercar", color: "#d8641c", rimColor: "#2b2e33" },
  },
  {
    id: uuid(5), sellerKey: "london", make: "Rolls-Royce", model: "Ghost", variant: null, year: 2022, price: 265000, currency: "GBP",
    countryCode: "GB", region: "Greater London", city: "London", mileage: 3100, mileageUnit: "mi", condition: "used", bodyStyle: "sedan",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "luxury", exteriorColour: "Arctic White",
    interiorColour: "Seashell leather", engine: "6.75 L twin-turbo V12", powerHp: 571, doors: 4, seats: 5, featured: true, inspectionAvailable: true,
    description: `${DEMO_NOTE}\n\nFlagship saloon with starlight headliner and rear theatre configuration (illustrative).`,
    publishedAt: "2026-10-02T11:00:00Z", render: { preset: "sedan", color: "#e9e7e1", rimColor: "#c8ccd2" },
  },
  {
    id: uuid(6), sellerKey: "dubai", make: "Bentley", model: "Continental GT", variant: "V8", year: 2020, price: 695000, currency: "AED",
    countryCode: "AE", region: "Dubai", city: "Dubai", mileage: 21500, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "awd", segment: "luxury", exteriorColour: "Beluga black",
    interiorColour: "Linen leather", engine: "4.0 L twin-turbo V8", powerHp: 550, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nHand-finished grand tourer with rotating dashboard display (illustrative).`,
    publishedAt: "2026-09-30T08:30:00Z", render: { preset: "gt", color: "#121316" },
  },
  {
    id: uuid(7), sellerKey: "munich", make: "Mercedes-Benz", model: "S-Class", variant: "S 580 4MATIC", year: 2023, price: 129900, currency: "EUR",
    countryCode: "DE", region: "Bavaria", city: "Munich", mileage: 18000, mileageUnit: "km", condition: "used", bodyStyle: "sedan",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "luxury", exteriorColour: "Obsidian black metallic",
    interiorColour: "Macchiato beige", engine: "4.0 L V8 mild hybrid", powerHp: 503, doors: 4, seats: 5, inspectionAvailable: true,
    description: `${DEMO_NOTE}\n\nLong-wheelbase luxury saloon with rear-axle steering and executive rear seating (illustrative).`,
    publishedAt: "2026-09-29T13:15:00Z", render: { preset: "sedan", color: "#0f1013" },
  },
  {
    id: uuid(8), sellerKey: "p3", make: "Aston Martin", model: "DB11", variant: "V8", year: 2019, price: 89950, currency: "GBP",
    countryCode: "GB", region: "Greater Manchester", city: "Manchester", mileage: 24800, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "automatic", fuelType: "petrol", drivetrain: "rwd", segment: "luxury", exteriorColour: "Magnetic Silver",
    interiorColour: "Obsidian black", engine: "4.0 L twin-turbo V8", powerHp: 510, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nFront-engined 2+2 grand tourer, two private owners (illustrative).`,
    publishedAt: "2026-09-28T19:02:00Z", render: { preset: "gt", color: "#8d939b" },
  },
  {
    id: uuid(9), sellerKey: "p1", make: "BMW", model: "M3", variant: "Competition xDrive", year: 2022, price: 84500, currency: "EUR",
    countryCode: "FR", region: "Île-de-France", city: "Paris", mileage: 26000, mileageUnit: "km", condition: "used", bodyStyle: "sedan",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "performance", exteriorColour: "Isle of Man Green",
    interiorColour: "Black/Yellow leather", engine: "3.0 L twin-turbo straight-six", powerHp: 510, doors: 4, seats: 5,
    description: `${DEMO_NOTE}\n\nHigh-performance compact saloon with carbon bucket seats (illustrative).`,
    publishedAt: "2026-09-27T07:45:00Z", render: { preset: "sedan", color: "#1f4a3a", blackRoof: true },
  },
  {
    id: uuid(10), sellerKey: "munich", make: "Audi", model: "RS 6 Avant", variant: null, year: 2021, price: 109000, currency: "EUR",
    countryCode: "DE", region: "Bavaria", city: "Munich", mileage: 38000, mileageUnit: "km", condition: "used", bodyStyle: "estate",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "performance", exteriorColour: "Nardo Grey",
    interiorColour: "Black Valcona leather", engine: "4.0 L twin-turbo V8 mild hybrid", powerHp: 600, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nHigh-performance estate with dynamic package and ceramic brakes (illustrative).`,
    publishedAt: "2026-09-26T16:10:00Z", render: { preset: "estate", color: "#85898c", blackRoof: true, rimColor: "#2a2c30" },
  },
  {
    id: uuid(11), sellerKey: "p2", make: "Tesla", model: "Model 3", variant: "Long Range", year: 2022, price: 31500, currency: "USD",
    countryCode: "US", region: "Texas", city: "Austin", mileage: 29000, mileageUnit: "mi", condition: "used", bodyStyle: "sedan",
    transmission: "single_speed", fuelType: "electric", drivetrain: "awd", segment: "everyday", exteriorColour: "Pearl White",
    interiorColour: "Black", engine: "Dual-motor electric", powerHp: 434, doors: 4, seats: 5,
    description: `${DEMO_NOTE}\n\nDual-motor electric saloon with glass roof (illustrative).`,
    publishedAt: "2026-09-25T12:00:00Z", render: { preset: "sedan", color: "#e6e6e3", blackRoof: true },
  },
  {
    id: uuid(12), sellerKey: "melbourne", make: "Tesla", model: "Model Y", variant: "Performance", year: 2023, price: 64900, currency: "AUD",
    countryCode: "AU", region: "Victoria", city: "Melbourne", mileage: 17500, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "single_speed", fuelType: "electric", drivetrain: "awd", segment: "everyday", exteriorColour: "Midnight Silver",
    interiorColour: "Black", engine: "Dual-motor electric", powerHp: 456, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nPerformance electric SUV with 21-inch wheels (illustrative).`,
    publishedAt: "2026-09-24T03:20:00Z", render: { preset: "suv", color: "#474b52", blackRoof: true },
  },
  {
    id: uuid(13), sellerKey: "melbourne", make: "BYD", model: "Seal", variant: "Performance", year: 2025, price: 58990, currency: "AUD",
    countryCode: "AU", region: "Victoria", city: "Melbourne", mileage: 15, mileageUnit: "km", condition: "new", bodyStyle: "sedan",
    transmission: "single_speed", fuelType: "electric", drivetrain: "awd", segment: "everyday", exteriorColour: "Arctic Blue",
    interiorColour: "Black", engine: "Dual-motor electric", powerHp: 523, doors: 4, seats: 5,
    description: `${DEMO_NOTE}\n\nNew electric performance saloon (illustrative).`,
    publishedAt: "2026-10-07T01:00:00Z", render: { preset: "sedan", color: "#7b9cc0", blackRoof: true },
  },
  {
    id: uuid(14), sellerKey: "dubai", make: "Toyota", model: "Land Cruiser", variant: "300 GR Sport", year: 2022, price: 389000, currency: "AED",
    countryCode: "AE", region: "Abu Dhabi", city: "Abu Dhabi", mileage: 42000, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "petrol", drivetrain: "4wd", segment: "luxury", exteriorColour: "Precious White Pearl",
    interiorColour: "Black/Red leather", engine: "3.5 L twin-turbo V6", powerHp: 409, doors: 5, seats: 7, inspectionAvailable: true,
    description: `${DEMO_NOTE}\n\nBody-on-frame 4×4 with locking differentials (illustrative).`,
    publishedAt: "2026-09-23T10:40:00Z", render: { preset: "suv", color: "#ecebe6", rimColor: "#2a2c30" },
  },
  {
    id: uuid(15), sellerKey: "tokyo", make: "Toyota", model: "Corolla", variant: "Hybrid", year: 2021, price: 2180000, currency: "JPY",
    countryCode: "JP", region: "Tokyo", city: "Tokyo", mileage: 28000, mileageUnit: "km", condition: "used", bodyStyle: "hatchback",
    transmission: "automatic", fuelType: "hybrid", drivetrain: "fwd", segment: "everyday", exteriorColour: "Silver Metallic",
    interiorColour: "Black fabric", engine: "1.8 L hybrid", powerHp: 122, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nEfficient hybrid hatchback with full Japanese inspection history (illustrative).`,
    publishedAt: "2026-09-22T05:30:00Z", render: { preset: "hatch", color: "#a7acb2" },
  },
  {
    id: uuid(16), sellerKey: "tokyo", make: "Honda", model: "Civic", variant: "Type R", year: 2023, price: 5280000, currency: "JPY",
    countryCode: "JP", region: "Osaka", city: "Osaka", mileage: 9000, mileageUnit: "km", condition: "used", bodyStyle: "hatchback",
    transmission: "manual", fuelType: "petrol", drivetrain: "fwd", segment: "performance", exteriorColour: "Championship White",
    interiorColour: "Red/Black", engine: "2.0 L turbo four-cylinder", powerHp: 330, doors: 5, seats: 4,
    description: `${DEMO_NOTE}\n\nFront-wheel-drive performance hatchback with six-speed manual (illustrative).`,
    publishedAt: "2026-09-21T09:00:00Z", render: { preset: "hatch", color: "#f0f0ee", caliper: "#c4161c", rimColor: "#202226" },
  },
  {
    id: uuid(17), sellerKey: "tokyo", make: "Nissan", model: "GT-R", variant: "Premium Edition", year: 2017, price: 9800000, currency: "JPY",
    countryCode: "JP", region: "Kanagawa", city: "Yokohama", mileage: 33000, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "awd", segment: "performance", exteriorColour: "Gun Metallic",
    interiorColour: "Black leather", engine: "3.8 L twin-turbo V6", powerHp: 570, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nAll-wheel-drive grand touring coupé (illustrative).`,
    publishedAt: "2026-09-20T14:30:00Z", render: { preset: "gt", color: "#4a4d52" },
  },
  {
    id: uuid(18), sellerKey: "munich", make: "Volkswagen", model: "Golf", variant: "GTI", year: 2020, price: 27900, currency: "EUR",
    countryCode: "DE", region: "Berlin", city: "Berlin", mileage: 41000, mileageUnit: "km", condition: "used", bodyStyle: "hatchback",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "fwd", segment: "everyday", exteriorColour: "Tornado Red",
    interiorColour: "Tartan cloth", engine: "2.0 L turbo four-cylinder", powerHp: 245, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nThe benchmark hot hatch (illustrative).`,
    publishedAt: "2026-09-19T11:11:00Z", render: { preset: "hatch", color: "#a4161c" },
  },
  {
    id: uuid(19), sellerKey: "p4", make: "Volvo", model: "XC90", variant: "Recharge T8", year: 2022, price: 649000, currency: "SEK",
    countryCode: "SE", region: null, city: "Stockholm", mileage: 36000, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "plug_in_hybrid", drivetrain: "awd", segment: "luxury", exteriorColour: "Denim Blue",
    interiorColour: "Blond leather", engine: "2.0 L plug-in hybrid", powerHp: 455, doors: 5, seats: 7,
    description: `${DEMO_NOTE}\n\nSeven-seat plug-in hybrid SUV (illustrative).`,
    publishedAt: "2026-09-18T08:00:00Z", render: { preset: "suv", color: "#2f4566" },
  },
  {
    id: uuid(20), sellerKey: "p5", make: "Hyundai", model: "Ioniq 5", variant: "Long Range AWD", year: 2023, price: 46500, currency: "CAD",
    countryCode: "CA", region: "Ontario", city: "Toronto", mileage: 21000, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "single_speed", fuelType: "electric", drivetrain: "awd", segment: "everyday", exteriorColour: "Digital Teal",
    interiorColour: "Grey", engine: "Dual-motor electric", powerHp: 320, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\n800-volt electric crossover with ultra-fast charging (illustrative).`,
    publishedAt: "2026-09-17T17:45:00Z", render: { preset: "hatch", color: "#3c6e71" },
  },
  {
    id: uuid(21), sellerKey: "london", make: "Kia", model: "Sportage", variant: "GT-Line Hybrid", year: 2022, price: 21995, currency: "GBP",
    countryCode: "GB", region: "West Midlands", city: "Birmingham", mileage: 24000, mileageUnit: "mi", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "hybrid", drivetrain: "fwd", segment: "everyday", exteriorColour: "Lunar Silver",
    interiorColour: "Black", engine: "1.6 L turbo hybrid", powerHp: 226, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nFamily hybrid SUV with panoramic roof (illustrative).`,
    publishedAt: "2026-09-16T10:20:00Z", render: { preset: "suv", color: "#a9adb3", blackRoof: true },
  },
  {
    id: uuid(22), sellerKey: "london", make: "Land Rover", model: "Range Rover Sport", variant: "P400 Dynamic SE", year: 2023, price: 84950, currency: "GBP",
    countryCode: "GB", region: "Greater London", city: "London", mileage: 9500, mileageUnit: "mi", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "luxury", exteriorColour: "Carpathian Grey",
    interiorColour: "Ebony leather", engine: "3.0 L straight-six mild hybrid", powerHp: 400, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nLuxury performance SUV with air suspension (illustrative).`,
    publishedAt: "2026-09-15T09:30:00Z", render: { preset: "suv", color: "#3b3e43", blackRoof: true, rimColor: "#2a2c30" },
  },
  {
    id: uuid(23), sellerKey: "la", make: "Jeep", model: "Wrangler", variant: "Rubicon", year: 2021, price: 41900, currency: "USD",
    countryCode: "US", region: "Colorado", city: "Denver", mileage: 31000, mileageUnit: "mi", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "petrol", drivetrain: "4wd", segment: "everyday", exteriorColour: "Sarge Green",
    interiorColour: "Black", engine: "3.6 L V6", powerHp: 285, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nTrail-rated 4×4 with removable roof panels (illustrative).`,
    publishedAt: "2026-09-14T15:00:00Z", render: { preset: "offroader", color: "#4b5a3a", rimColor: "#1c1d20" },
  },
  {
    id: uuid(24), sellerKey: "la", make: "Ford", model: "Mustang", variant: "GT", year: 2020, price: 33500, currency: "USD",
    countryCode: "US", region: "Florida", city: "Miami", mileage: 22000, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "manual", fuelType: "petrol", drivetrain: "rwd", segment: "performance", exteriorColour: "Race Red",
    interiorColour: "Ebony", engine: "5.0 L V8", powerHp: 460, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nNaturally aspirated V8 with six-speed manual (illustrative).`,
    publishedAt: "2026-09-13T20:15:00Z", render: { preset: "gt", color: "#b0141c", rimColor: "#22252a" },
  },
  {
    id: uuid(25), sellerKey: "la", make: "Chevrolet", model: "Corvette", variant: "Stingray 3LT", year: 2021, price: 69900, currency: "USD",
    countryCode: "US", region: "Arizona", city: "Phoenix", mileage: 12000, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "rwd", segment: "performance", exteriorColour: "Rapid Blue",
    interiorColour: "Jet Black", engine: "6.2 L V8", powerHp: 495, doors: 2, seats: 2,
    description: `${DEMO_NOTE}\n\nMid-engined V8 sports car with removable roof panel (illustrative).`,
    publishedAt: "2026-09-12T13:00:00Z", render: { preset: "supercar", color: "#2367b3" },
  },
  {
    id: uuid(26), sellerKey: "p5", make: "Lexus", model: "LC 500", variant: null, year: 2021, price: 98000, currency: "CAD",
    countryCode: "CA", region: "British Columbia", city: "Vancouver", mileage: 16000, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "automatic", fuelType: "petrol", drivetrain: "rwd", segment: "luxury", exteriorColour: "Structural Blue",
    interiorColour: "Black/Blue", engine: "5.0 L V8", powerHp: 471, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nGrand tourer with naturally aspirated V8 (illustrative).`,
    publishedAt: "2026-09-11T22:00:00Z", render: { preset: "gt", color: "#2a4fa0" },
  },
  {
    id: uuid(27), sellerKey: "munich", make: "Porsche", model: "911", variant: "Carrera 2 (964)", year: 1991, price: 109000, currency: "EUR",
    countryCode: "DE", region: "Baden-Württemberg", city: "Stuttgart", mileage: 118000, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "manual", fuelType: "petrol", drivetrain: "rwd", segment: "classic", exteriorColour: "Guards Red",
    interiorColour: "Black leather", engine: "3.6 L flat-six", powerHp: 250, doors: 2, seats: 4,
    description: `${DEMO_NOTE}\n\nAir-cooled classic with documented history (illustrative).`,
    publishedAt: "2026-09-10T10:00:00Z", render: { preset: "classic", color: "#b31b1b" },
  },
  {
    id: uuid(28), sellerKey: "p3", make: "Jaguar", model: "E-Type", variant: "Series 1 4.2 Fixed Head Coupé", year: 1966, price: 145000, currency: "GBP",
    countryCode: "GB", region: "Greater Manchester", city: "Manchester", mileage: 61000, mileageUnit: "mi", condition: "used", bodyStyle: "coupe",
    transmission: "manual", fuelType: "petrol", drivetrain: "rwd", segment: "classic", exteriorColour: "British Racing Green",
    interiorColour: "Tan leather", engine: "4.2 L straight-six", powerHp: 265, doors: 2, seats: 2, inspectionAvailable: true,
    description: `${DEMO_NOTE}\n\nRestored classic grand tourer (illustrative).`,
    publishedAt: "2026-09-09T09:00:00Z", render: { preset: "classic", color: "#1d3b2a" },
  },
  {
    id: uuid(29), sellerKey: "la", make: "Mercedes-Benz", model: "280 SL", variant: "Pagoda", year: 1969, price: 128000, currency: "USD",
    countryCode: "US", region: "California", city: "San Francisco", mileage: 74000, mileageUnit: "mi", condition: "used", bodyStyle: "convertible",
    transmission: "automatic", fuelType: "petrol", drivetrain: "rwd", segment: "classic", exteriorColour: "Signal Red",
    interiorColour: "Cognac MB-Tex", engine: "2.8 L straight-six", powerHp: 170, doors: 2, seats: 2,
    description: `${DEMO_NOTE}\n\nClassic roadster with hardtop (illustrative).`,
    publishedAt: "2026-09-08T18:00:00Z", render: { preset: "classic", color: "#9a1a1d" },
  },
  {
    id: uuid(30), sellerKey: "p7", make: "Toyota", model: "Hilux", variant: "2.8 GD-6 Legend Double Cab", year: 2021, price: 549900, currency: "ZAR",
    countryCode: "ZA", region: "Gauteng", city: "Johannesburg", mileage: 68000, mileageUnit: "km", condition: "used", bodyStyle: "pickup",
    transmission: "automatic", fuelType: "diesel", drivetrain: "4wd", segment: "everyday", exteriorColour: "Glacier White",
    interiorColour: "Black leather", engine: "2.8 L turbo-diesel", powerHp: 201, doors: 4, seats: 5,
    description: `${DEMO_NOTE}\n\nDouble-cab 4×4 pickup with tow bar (illustrative).`,
    publishedAt: "2026-09-07T07:00:00Z", render: { preset: "pickup", color: "#e3e4e5" },
  },
  {
    id: uuid(31), sellerKey: "p6", make: "Lexus", model: "RX", variant: "350", year: 2020, price: 48000000, currency: "NGN",
    countryCode: "NG", region: "Lagos", city: "Lagos", mileage: 54000, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "petrol", drivetrain: "awd", segment: "luxury", exteriorColour: "Atomic Silver",
    interiorColour: "Parchment", engine: "3.5 L V6", powerHp: 295, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nPremium crossover SUV (illustrative).`,
    publishedAt: "2026-09-06T12:00:00Z", render: { preset: "suv", color: "#b6b9be", blackRoof: true },
  },
  {
    id: uuid(32), sellerKey: "dubai", make: "Mercedes-Benz", model: "G-Class", variant: "G 63", year: 2022, price: 720000, currency: "AED",
    countryCode: "AE", region: "Dubai", city: "Dubai", mileage: 19000, mileageUnit: "km", condition: "used", bodyStyle: "suv",
    transmission: "automatic", fuelType: "petrol", drivetrain: "4wd", segment: "luxury", exteriorColour: "Obsidian Black",
    interiorColour: "Black/Red Nappa", engine: "4.0 L twin-turbo V8", powerHp: 585, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nIconic off-roader with three locking differentials (illustrative).`,
    publishedAt: "2026-09-05T16:00:00Z", render: { preset: "offroader", color: "#101114" },
  },
  {
    id: uuid(33), sellerKey: "p1", make: "Peugeot", model: "208", variant: "Allure", year: 2022, price: 16900, currency: "EUR",
    countryCode: "FR", region: "Auvergne-Rhône-Alpes", city: "Lyon", mileage: 23000, mileageUnit: "km", condition: "used", bodyStyle: "hatchback",
    transmission: "manual", fuelType: "petrol", drivetrain: "fwd", segment: "everyday", exteriorColour: "Elixir Red",
    interiorColour: "Grey fabric", engine: "1.2 L turbo three-cylinder", powerHp: 100, doors: 5, seats: 5,
    description: `${DEMO_NOTE}\n\nEconomical city car (illustrative).`,
    publishedAt: "2026-09-04T09:30:00Z", render: { preset: "hatch", color: "#8e1020", blackRoof: true },
  },
  {
    id: uuid(34), sellerKey: "munich", make: "Audi", model: "R8", variant: "V10 Performance", year: 2020, price: 149000, currency: "EUR",
    countryCode: "DE", region: "Bavaria", city: "Munich", mileage: 15000, mileageUnit: "km", condition: "used", bodyStyle: "coupe",
    transmission: "dual_clutch", fuelType: "petrol", drivetrain: "awd", segment: "supercar", exteriorColour: "Suzuka Grey",
    interiorColour: "Black", engine: "5.2 L V10", powerHp: 620, doors: 2, seats: 2, sold: true,
    description: `${DEMO_NOTE}\n\nShown as an example of a listing marked as sold (illustrative).`,
    publishedAt: "2026-08-28T10:00:00Z", render: { preset: "supercar", color: "#9b9fa4" },
  },
];

/** Paths of the illustrative renders generated for each demo vehicle. */
export function demoImagePaths(v: DemoVehicle): { url: string; alt: string }[] {
  const base = `/renders/demo/${v.id.slice(-4)}`;
  const label = `${v.year} ${v.make} ${v.model}`;
  return [
    { url: `${base}-a.webp`, alt: `Illustrative studio render representing a ${v.exteriorColour.toLowerCase()} ${label}` },
    { url: `${base}-b.webp`, alt: `Illustrative rear three-quarter render representing a ${label}` },
  ];
}
