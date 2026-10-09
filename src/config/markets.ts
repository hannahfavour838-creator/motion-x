/**
 * Market catalogue. This mirrors the `countries` table seeded by the database
 * migrations; the database remains the source of truth for which markets are
 * enabled. Adding a market = add a row in the DB (and optionally here for
 * nicer labels before the DB is reachable).
 */
export type DistanceUnit = "km" | "mi";

export interface Market {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // ISO 4217
  distanceUnit: DistanceUnit;
  locale: string; // BCP 47 locale used for number/date formatting
  region: "Europe" | "North America" | "Middle East" | "Asia Pacific" | "Africa" | "Latin America";
}

export const MARKETS: Market[] = [
  { code: "US", name: "United States", currency: "USD", distanceUnit: "mi", locale: "en-US", region: "North America" },
  { code: "CA", name: "Canada", currency: "CAD", distanceUnit: "km", locale: "en-CA", region: "North America" },
  { code: "MX", name: "Mexico", currency: "MXN", distanceUnit: "km", locale: "es-MX", region: "Latin America" },
  { code: "BR", name: "Brazil", currency: "BRL", distanceUnit: "km", locale: "pt-BR", region: "Latin America" },
  { code: "GB", name: "United Kingdom", currency: "GBP", distanceUnit: "mi", locale: "en-GB", region: "Europe" },
  { code: "IE", name: "Ireland", currency: "EUR", distanceUnit: "km", locale: "en-IE", region: "Europe" },
  { code: "DE", name: "Germany", currency: "EUR", distanceUnit: "km", locale: "de-DE", region: "Europe" },
  { code: "FR", name: "France", currency: "EUR", distanceUnit: "km", locale: "fr-FR", region: "Europe" },
  { code: "IT", name: "Italy", currency: "EUR", distanceUnit: "km", locale: "it-IT", region: "Europe" },
  { code: "ES", name: "Spain", currency: "EUR", distanceUnit: "km", locale: "es-ES", region: "Europe" },
  { code: "NL", name: "Netherlands", currency: "EUR", distanceUnit: "km", locale: "nl-NL", region: "Europe" },
  { code: "BE", name: "Belgium", currency: "EUR", distanceUnit: "km", locale: "nl-BE", region: "Europe" },
  { code: "AT", name: "Austria", currency: "EUR", distanceUnit: "km", locale: "de-AT", region: "Europe" },
  { code: "PT", name: "Portugal", currency: "EUR", distanceUnit: "km", locale: "pt-PT", region: "Europe" },
  { code: "CH", name: "Switzerland", currency: "CHF", distanceUnit: "km", locale: "de-CH", region: "Europe" },
  { code: "SE", name: "Sweden", currency: "SEK", distanceUnit: "km", locale: "sv-SE", region: "Europe" },
  { code: "NO", name: "Norway", currency: "NOK", distanceUnit: "km", locale: "nb-NO", region: "Europe" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", distanceUnit: "km", locale: "en-AE", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", distanceUnit: "km", locale: "en-SA", region: "Middle East" },
  { code: "QA", name: "Qatar", currency: "QAR", distanceUnit: "km", locale: "en-QA", region: "Middle East" },
  { code: "JP", name: "Japan", currency: "JPY", distanceUnit: "km", locale: "ja-JP", region: "Asia Pacific" },
  { code: "KR", name: "South Korea", currency: "KRW", distanceUnit: "km", locale: "ko-KR", region: "Asia Pacific" },
  { code: "CN", name: "China", currency: "CNY", distanceUnit: "km", locale: "zh-CN", region: "Asia Pacific" },
  { code: "HK", name: "Hong Kong", currency: "HKD", distanceUnit: "km", locale: "en-HK", region: "Asia Pacific" },
  { code: "SG", name: "Singapore", currency: "SGD", distanceUnit: "km", locale: "en-SG", region: "Asia Pacific" },
  { code: "IN", name: "India", currency: "INR", distanceUnit: "km", locale: "en-IN", region: "Asia Pacific" },
  { code: "AU", name: "Australia", currency: "AUD", distanceUnit: "km", locale: "en-AU", region: "Asia Pacific" },
  { code: "NZ", name: "New Zealand", currency: "NZD", distanceUnit: "km", locale: "en-NZ", region: "Asia Pacific" },
  { code: "ZA", name: "South Africa", currency: "ZAR", distanceUnit: "km", locale: "en-ZA", region: "Africa" },
  { code: "NG", name: "Nigeria", currency: "NGN", distanceUnit: "km", locale: "en-NG", region: "Africa" },
  { code: "KE", name: "Kenya", currency: "KES", distanceUnit: "km", locale: "en-KE", region: "Africa" },
  { code: "GH", name: "Ghana", currency: "GHS", distanceUnit: "km", locale: "en-GH", region: "Africa" },
  { code: "EG", name: "Egypt", currency: "EGP", distanceUnit: "km", locale: "en-EG", region: "Africa" },
];

export const CURRENCIES = [
  "USD", "EUR", "GBP", "AED", "JPY", "CAD", "AUD", "CHF", "SEK", "NOK", "SAR", "QAR",
  "CNY", "HKD", "SGD", "KRW", "INR", "NZD", "ZAR", "NGN", "KES", "GHS", "EGP", "MXN", "BRL",
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/** Display currencies offered in the currency switcher (configurable). */
export const DISPLAY_CURRENCIES: string[] = (process.env.NEXT_PUBLIC_DISPLAY_CURRENCIES || "USD,EUR,GBP,AED")
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter((c) => (CURRENCIES as readonly string[]).includes(c));

const marketByCode = new Map(MARKETS.map((m) => [m.code, m]));

export function getMarket(code: string | null | undefined): Market | undefined {
  if (!code) return undefined;
  return marketByCode.get(code.toUpperCase());
}

export function countryName(code: string | null | undefined): string {
  return getMarket(code)?.name ?? (code || "");
}

export function isKnownCurrency(code: string): code is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(code);
}
