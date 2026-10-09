"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadLimits } from "@/config/site";
import { getSessionUser, isSeller, type SessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { dealerSchema, fieldErrors, formObject, listingSchema, profileSchema, type ListingInput } from "@/lib/validation";

async function sellerContext(): Promise<{ user: SessionUser; supabase: Awaited<ReturnType<typeof createClient>> } | ActionResult<never>> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Seller tools require Supabase to be configured." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (!isSeller(user)) return { ok: false, message: "Switch to a seller account to manage listings." };
  if (user.status !== "active") return { ok: false, message: "Your account is suspended. Contact support for help." };
  return { user, supabase: await createClient() };
}

function isErr(x: unknown): x is ActionResult<never> {
  return typeof x === "object" && x !== null && "ok" in x;
}

function toRow(d: ListingInput) {
  return {
    make: d.make, model: d.model, variant: d.variant, year: d.year, price: d.price, currency: d.currency,
    country_code: d.countryCode, region: d.region, city: d.city, mileage: d.mileage, mileage_unit: d.mileageUnit,
    condition: d.condition, body_style: d.bodyStyle, transmission: d.transmission, fuel_type: d.fuelType,
    drivetrain: d.drivetrain, segment: d.segment, exterior_colour: d.exteriorColour, interior_colour: d.interiorColour,
    engine: d.engine, power_hp: d.powerHp, doors: d.doors, seats: d.seats, description: d.description,
    inspection_available: d.inspectionAvailable,
  };
}

function friendly(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  if (message.includes("protected") || message.includes("not allowed") || message.includes("suspended")) return message.replace(/^.*?: /, "");
  if (message.includes("24 photographs")) return "A listing can have at most 24 photographs.";
  if (message.includes("Only active seller")) return "Only active seller accounts can create listings.";
  return fallback;
}

// ── Listings ────────────────────────────────────────────────────────────

export async function createListing(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const parsed = listingSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const submit = fd.get("intent") === "submit";
  const { data, error } = await ctx.supabase
    .from("vehicles")
    .insert({ ...toRow(parsed.data), seller_id: ctx.user.id, status: submit ? "pending_review" : "draft" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: friendly(error?.message, "We couldn't save your listing. Please try again.") };
  revalidatePath("/dashboard");
  redirect(`/dashboard/listings/${data.id}/edit?created=1`);
}

export async function updateListing(id: string, _: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const parsed = listingSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { data: current } = await ctx.supabase.from("vehicles").select("id, status, seller_id").eq("id", id).eq("seller_id", ctx.user.id).maybeSingle();
  if (!current) return { ok: false, message: "Listing not found." };
  const submit = fd.get("intent") === "submit" && ["draft", "rejected"].includes(current.status);
  const { data: updated, error } = await ctx.supabase
    .from("vehicles")
    .update({ ...toRow(parsed.data), ...(submit ? { status: "pending_review" } : {}) })
    .eq("id", id)
    .eq("seller_id", ctx.user.id)
    .select("status, slug")
    .single();
  if (error || !updated) return { ok: false, message: friendly(error?.message, "We couldn't save your changes. Please try again.") };
  revalidatePath(`/dashboard/listings/${id}/edit`);
  revalidatePath(`/cars/${updated.slug}`);
  const reReview = current.status === "active" && updated.status === "pending_review";
  return {
    ok: true,
    message: submit
      ? "Submitted for review. We'll notify you when it's live."
      : reReview
        ? "Saved. Because key details changed, the listing is back in review and temporarily hidden."
        : "Changes saved.",
  };
}

const TRANSITIONS: Record<string, string> = {
  submit: "pending_review",
  withdraw: "draft",
  pause: "paused",
  resume: "active",
  sold: "sold",
  relist: "active",
};

export async function setListingStatus(id: string, intent: keyof typeof TRANSITIONS): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const status = TRANSITIONS[intent];
  if (!status) return { ok: false, message: "Unknown action." };
  if (intent === "submit") {
    const { count } = await ctx.supabase.from("vehicle_images").select("id", { count: "exact", head: true }).eq("vehicle_id", id);
    if (!count) return { ok: false, message: "Add at least one photograph before submitting for review." };
  }
  const { data, error } = await ctx.supabase.from("vehicles").update({ status }).eq("id", id).eq("seller_id", ctx.user.id).select("status, slug").maybeSingle();
  if (error || !data) return { ok: false, message: friendly(error?.message, "That change isn't possible for this listing right now.") };
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/cars/${data.slug}`);
  const messages: Record<string, string> = {
    pending_review: "Submitted for review.",
    draft: "Withdrawn to drafts.",
    paused: "Listing paused — it is hidden from buyers.",
    active: "Listing is live again.",
    sold: "Marked as sold. Congratulations!",
  };
  return { ok: true, message: data.status === "active" && intent === "submit" ? "Published." : messages[data.status] ?? "Updated." };
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const { data: images } = await ctx.supabase.from("vehicle_images").select("storage_path").eq("vehicle_id", id);
  const { data, error } = await ctx.supabase.from("vehicles").delete().eq("id", id).eq("seller_id", ctx.user.id).select("id");
  if (error || !data?.length) return { ok: false, message: "Only drafts, listings in review or listings needing changes can be deleted. Mark live listings as sold instead." };
  const paths = (images ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await ctx.supabase.storage.from("vehicle-images").remove(paths);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Listing deleted." };
}

// ── Photographs ─────────────────────────────────────────────────────────

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export async function createImageUpload(vehicleId: string, file: { type: string; size: number }): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  if (!(uploadLimits.allowedImageTypes as readonly string[]).includes(file.type)) return { ok: false, message: "Use JPEG, PNG, WebP or AVIF images." };
  if (file.size > uploadLimits.maxImageBytes) return { ok: false, message: `Images must be ${uploadLimits.maxImageBytes / 1024 / 1024} MB or smaller.` };
  const { data: v } = await ctx.supabase.from("vehicles").select("id").eq("id", vehicleId).eq("seller_id", ctx.user.id).maybeSingle();
  if (!v) return { ok: false, message: "Listing not found." };
  const { count } = await ctx.supabase.from("vehicle_images").select("id", { count: "exact", head: true }).eq("vehicle_id", vehicleId);
  if ((count ?? 0) >= uploadLimits.maxImagesPerListing) return { ok: false, message: `A listing can have at most ${uploadLimits.maxImagesPerListing} photographs.` };
  const path = `${ctx.user.id}/${vehicleId}/${randomUUID()}.${EXT[file.type]}`;
  const { data, error } = await ctx.supabase.storage.from("vehicle-images").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: "Upload could not be started. Please try again." };
  return { ok: true, data: { signedUrl: data.signedUrl, path } };
}

export async function registerImage(vehicleId: string, path: string, meta: { width?: number; height?: number; alt?: string }): Promise<ActionResult<{ id: string }>> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  if (!path.startsWith(`${ctx.user.id}/${vehicleId}/`) || path.includes("..")) return { ok: false, message: "Invalid upload." };
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data: listing } = await ctx.supabase.storage.from("vehicle-images").list(folder, { search: name, limit: 1 });
  if (!listing?.some((o) => o.name === name)) return { ok: false, message: "Upload not found. Please try again." };
  const { data: last } = await ctx.supabase.from("vehicle_images").select("position").eq("vehicle_id", vehicleId).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await ctx.supabase
    .from("vehicle_images")
    .insert({
      vehicle_id: vehicleId,
      storage_path: path,
      width: meta.width ? Math.round(meta.width) : null,
      height: meta.height ? Math.round(meta.height) : null,
      alt: meta.alt?.slice(0, 200) || null,
      position: (last?.position ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !data) {
    await ctx.supabase.storage.from("vehicle-images").remove([path]);
    return { ok: false, message: friendly(error?.message, "We couldn't attach that photo.") };
  }
  revalidatePath(`/dashboard/listings/${vehicleId}/edit`);
  return { ok: true, data: { id: data.id } };
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) return { ok: false, message: "Photo not found." };
  // Images of public listings are readable by everyone, so confirm ownership explicitly
  // rather than relying on RLS silently deleting nothing.
  const { data: img } = await ctx.supabase
    .from("vehicle_images")
    .select("id, storage_path, vehicle_id, vehicle:vehicles!inner(seller_id)")
    .eq("id", imageId)
    .eq("vehicle.seller_id", ctx.user.id)
    .maybeSingle();
  if (!img) return { ok: false, message: "Photo not found." };
  const { data: removed, error } = await ctx.supabase.from("vehicle_images").delete().eq("id", imageId).select("id");
  if (error || !removed?.length) return { ok: false, message: "We couldn't remove that photo." };
  if (img.storage_path?.startsWith(`${ctx.user.id}/`)) await ctx.supabase.storage.from("vehicle-images").remove([img.storage_path]);
  revalidatePath(`/dashboard/listings/${img.vehicle_id}/edit`);
  return { ok: true, message: "Photo removed." };
}

export async function reorderImages(vehicleId: string, orderedIds: string[]): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const ids = orderedIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, uploadLimits.maxImagesPerListing);
  const results = await Promise.all(ids.map((id, position) => ctx.supabase.from("vehicle_images").update({ position }).eq("id", id).eq("vehicle_id", vehicleId)));
  if (results.some((r) => r.error)) return { ok: false, message: "We couldn't save the new order." };
  revalidatePath(`/dashboard/listings/${vehicleId}/edit`);
  return { ok: true, message: "Photo order saved." };
}

// ── Enquiries & inspections ─────────────────────────────────────────────

export async function setEnquiryStatus(id: string, status: "new" | "read" | "replied" | "closed" | "spam"): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const { error } = await ctx.supabase.from("enquiries").update({ status }).eq("id", id).eq("seller_id", ctx.user.id);
  if (error) return { ok: false, message: "We couldn't update this enquiry." };
  revalidatePath("/dashboard/enquiries", "layout");
  return { ok: true, message: "Enquiry updated." };
}

export async function replyToEnquiry(enquiryId: string, _: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Messaging requires Supabase." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Your session has expired. Please sign in again." };
  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 3000) return { ok: false, message: "Write a message (up to 3,000 characters).", fieldErrors: { body: "Write a message (up to 3,000 characters)." } };
  const supabase = await createClient();
  const { error } = await supabase.from("enquiry_messages").insert({ enquiry_id: enquiryId, sender_id: user.id, body });
  if (error) return { ok: false, message: "We couldn't send your reply." };
  revalidatePath(`/dashboard/enquiries/${enquiryId}`);
  revalidatePath(`/account/enquiries/${enquiryId}`);
  return { ok: true, message: "Reply sent." };
}

export async function setInspectionStatus(id: string, status: "acknowledged" | "scheduled" | "completed" | "declined"): Promise<ActionResult> {
  const ctx = await sellerContext();
  if (isErr(ctx)) return ctx;
  const { error } = await ctx.supabase.from("inspection_requests").update({ status }).eq("id", id).eq("seller_id", ctx.user.id);
  if (error) return { ok: false, message: "We couldn't update this request." };
  revalidatePath("/dashboard/inspections");
  return { ok: true, message: "Request updated." };
}

// ── Profiles & verification ─────────────────────────────────────────────

export async function becomeSeller(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Accounts require Supabase." };
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/sell/start");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ account_type: "private_seller" }).eq("id", user.id);
  if (error) return { ok: false, message: "We couldn't switch your account. Please try again." };
  redirect("/dashboard/listings/new");
}

export async function saveDealerProfile(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Dealer tools require Supabase." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Your session has expired. Please sign in again." };
  const parsed = dealerSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const row = {
    business_name: d.businessName, description: d.description, country_code: d.countryCode, region: d.region, city: d.city,
    address_line: d.addressLine, website: d.website, public_email: d.publicEmail, public_phone: d.publicPhone, whatsapp: d.whatsapp,
  };
  const logo = String(fd.get("logo_path") ?? "");
  if (logo && logo.startsWith(`${user.id}/`)) Object.assign(row, { logo_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dealer-logos/${logo}` });
  const { data: existing } = await supabase.from("dealer_profiles").select("id, slug").eq("id", user.id).maybeSingle();
  let error;
  if (existing) {
    ({ error } = await supabase.from("dealer_profiles").update(row).eq("id", user.id));
  } else {
    const base = d.businessName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "dealer";
    const slug = `${base}-${randomUUID().slice(0, 4)}`;
    ({ error } = await supabase.from("dealer_profiles").insert({ ...row, id: user.id, slug }));
    if (!error && user.accountType !== "dealer") await supabase.from("profiles").update({ account_type: "dealer" }).eq("id", user.id);
  }
  if (error) return { ok: false, message: "We couldn't save your dealership profile." };
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dealers", "layout");
  return { ok: true, message: existing ? "Dealership profile saved." : "Your dealership storefront has been created." };
}

export async function createLogoUpload(file: { type: string; size: number }): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Uploads require Supabase." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  if (!types[file.type]) return { ok: false, message: "Use a PNG, JPEG or WebP logo." };
  if (file.size > uploadLimits.maxLogoBytes) return { ok: false, message: "Logos must be 2 MB or smaller." };
  const supabase = await createClient();
  const path = `${user.id}/logo-${randomUUID().slice(0, 8)}.${types[file.type]}`;
  const { data, error } = await supabase.storage.from("dealer-logos").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: "Upload could not be started." };
  return { ok: true, data: { signedUrl: data.signedUrl, path } };
}

export async function requestVerification(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Verification requires Supabase." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const kind = fd.get("kind") === "business" ? "business" : "identity";
  if (kind === "business" && !user.hasDealerProfile) return { ok: false, message: "Create your dealership profile first." };
  const details: Record<string, string> = {};
  for (const key of ["legal_name", "registration_number", "registration_country", "document_reference"]) {
    const v = String(fd.get(key) ?? "").trim().slice(0, 200);
    if (v) details[key] = v;
  }
  if (kind === "business" && (!details.legal_name || !details.registration_number)) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { legal_name: details.legal_name ? "" : "Required", registration_number: details.registration_number ? "" : "Required" } };
  }
  if (kind === "identity" && !details.legal_name) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { legal_name: "Required" } };
  const note = String(fd.get("applicant_note") ?? "").trim().slice(0, 2000) || null;
  const supabase = await createClient();
  const { error } = await supabase.from("verification_requests").insert({ profile_id: user.id, kind, details, applicant_note: note });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "You already have a pending request of this type." };
    return { ok: false, message: "We couldn't submit your request." };
  }
  revalidatePath("/dashboard/verification");
  return { ok: true, message: "Request submitted. An administrator will review it and may contact you for supporting documents." };
}

export async function updateProfile(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Accounts require Supabase." };
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const parsed = profileSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const [a, b] = await Promise.all([
    supabase.from("profiles").update({ display_name: d.displayName, country_code: d.countryCode, city: d.city, bio: d.bio }).eq("id", user.id),
    supabase.from("profile_private").update({ phone: d.phone }).eq("id", user.id),
  ]);
  if (a.error || b.error) return { ok: false, message: "We couldn't save your profile." };
  revalidatePath("/account", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved." };
}
