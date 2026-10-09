import { z } from "zod";
import { BODY_STYLES, CONDITIONS, DRIVETRAINS, FUEL_TYPES, SEGMENTS, TRANSMISSIONS } from "@/config/vehicles";
import { CURRENCIES } from "@/config/markets";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const email = z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Enter a valid email address" }));
const phone = z
  .string()
  .trim()
  .max(32)
  .regex(/^[+()\d\s-]*$/, { error: "Use digits, spaces, +, ( ) or -" })
  .optional()
  .transform((v) => (v ? v : null));

export const enquirySchema = z.object({
  vehicleId: z.uuid(),
  name: trimmed(80).min(2, { error: "Please enter your name" }),
  email,
  phone,
  preferredContact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  message: trimmed(3000).min(10, { error: "Please write at least 10 characters" }),
});

export const inspectionSchema = z.object({
  vehicleId: z.uuid(),
  name: trimmed(80).min(2, { error: "Please enter your name" }),
  email,
  phone,
  preferredDate: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Date.parse(v) >= Date.now() - 86_400_000), { error: "Choose a date from today onwards" }),
  inspector: optionalText(160),
  message: optionalText(2000),
});

export const REPORT_REASONS = {
  fraud_or_scam: "Suspected fraud or scam",
  misleading_information: "Misleading or incorrect information",
  duplicate: "Duplicate listing",
  wrong_price: "Price appears wrong",
  sold_or_unavailable: "Vehicle already sold / unavailable",
  offensive: "Offensive content",
  other: "Something else",
} as const;

export const reportSchema = z.object({
  vehicleId: z.uuid(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [keyof typeof REPORT_REASONS, ...(keyof typeof REPORT_REASONS)[]]),
  details: optionalText(2000),
  contactEmail: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => !v || z.email().safeParse(v).success, { error: "Enter a valid email address" }),
});

export const contactSchema = z.object({
  name: trimmed(80).min(2, { error: "Please enter your name" }),
  email,
  topic: z.enum(["buying", "selling", "dealer", "trust", "press", "other"]),
  message: trimmed(4000).min(10, { error: "Please write at least 10 characters" }),
});

const YEAR_MAX = new Date().getFullYear() + 1;
const intField = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(/[,\s]/g, ""))),
    z.number({ error: `${label} must be a number` }).int({ error: `${label} must be a whole number` }).min(min, { error: `${label} must be at least ${min}` }).max(max, { error: `${label} is too large` }),
  );
const optionalInt = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/[,\s]/g, ""))),
    z.number({ error: `${label} must be a number` }).int().min(min).max(max).nullable(),
  );

export const listingSchema = z.object({
  make: trimmed(60).min(1, { error: "Make is required" }),
  model: trimmed(80).min(1, { error: "Model is required" }),
  variant: optionalText(120),
  year: intField(1886, YEAR_MAX, "Year"),
  price: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(String(v).replace(/[,\s]/g, ""))),
    z.number({ error: "Enter an asking price" }).positive({ error: "Price must be greater than zero" }).max(99_999_999_999),
  ),
  currency: z.enum(CURRENCIES, { error: "Choose a currency" }),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, { error: "Choose a country" }),
  region: optionalText(80),
  city: trimmed(80).min(1, { error: "City is required" }),
  mileage: intField(0, 3_000_000, "Mileage"),
  mileageUnit: z.enum(["km", "mi"]),
  condition: z.enum(CONDITIONS),
  bodyStyle: z.enum(BODY_STYLES, { error: "Choose a body style" }),
  transmission: z.enum(TRANSMISSIONS, { error: "Choose a transmission" }),
  fuelType: z.enum(FUEL_TYPES, { error: "Choose a fuel type" }),
  drivetrain: z.preprocess((v) => (v === "" ? null : v), z.enum(DRIVETRAINS).nullable()),
  segment: z.enum(SEGMENTS),
  exteriorColour: optionalText(60),
  interiorColour: optionalText(60),
  engine: optionalText(120),
  powerHp: optionalInt(1, 5000, "Power"),
  doors: optionalInt(1, 7, "Doors"),
  seats: optionalInt(1, 12, "Seats"),
  description: optionalText(8000),
  inspectionAvailable: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const profileSchema = z.object({
  displayName: trimmed(80).min(2, { error: "Display name must be at least 2 characters" }),
  countryCode: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^[A-Z]{2}$/).nullable()),
  city: optionalText(80),
  bio: optionalText(1000),
  phone,
});

export const dealerSchema = z.object({
  businessName: trimmed(120).min(2, { error: "Business name is required" }),
  description: optionalText(4000),
  countryCode: z.string().regex(/^[A-Z]{2}$/, { error: "Choose a country" }),
  region: optionalText(80),
  city: trimmed(80).min(1, { error: "City is required" }),
  addressLine: optionalText(200),
  website: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
    .refine((v) => !v || z.url().safeParse(v).success, { error: "Enter a valid website address" }),
  publicEmail: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => !v || z.email().safeParse(v).success, { error: "Enter a valid email address" }),
  publicPhone: phone,
  whatsapp: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[\s()-]/g, "") : null))
    .refine((v) => !v || /^\+[1-9]\d{6,14}$/.test(v), { error: "Use international format, e.g. +447700900123" }),
});

export const signUpSchema = z.object({
  displayName: trimmed(80).min(2, { error: "Enter your name (at least 2 characters)" }),
  email,
  password: z.string().min(10, { error: "Use at least 10 characters" }).max(128),
  accountType: z.enum(["buyer", "private_seller", "dealer"]),
  businessName: optionalText(120),
  acceptTerms: z.literal("on", { error: "You need to accept the terms to continue" }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password" }).max(128),
});

/** Flatten zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function formObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}
