import { clsx, type ClassValue } from "clsx";
import { getMarket } from "@/config/markets";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Locale for formatting a listing's values: the listing market's locale, else English. */
export function localeFor(countryCode?: string | null): string {
  return getMarket(countryCode)?.locale ?? "en-GB";
}

export function formatPrice(amount: number, currency: string, locale = "en-GB"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en")}`;
  }
}

export function formatCompactPrice(amount: number, currency: string, locale = "en-GB"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
  } catch {
    return formatPrice(amount, currency, locale);
  }
}

export function formatNumber(n: number, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatMileage(mileage: number, unit: "km" | "mi", locale = "en-GB"): string {
  return `${formatNumber(mileage, locale)} ${unit}`;
}

export function formatDate(iso: string | null | undefined, locale = "en-GB", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...opts }).format(new Date(iso));
}

export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const diff = Math.round((now - Date.parse(iso)) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < 60) return "just now";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return formatDate(iso);
}

export function vehicleTitle(v: { year: number; make: string; model: string }): string {
  return `${v.year} ${v.make} ${v.model}`;
}

export function vehicleHref(v: { slug: string }): string {
  return `/cars/${v.slug}`;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}
