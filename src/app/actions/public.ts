"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { looksAutomated, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { contactSchema, enquirySchema, fieldErrors, formObject, inspectionSchema, reportSchema } from "@/lib/validation";

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  message: "Messaging is not available in this preview because no database is connected. Configure Supabase to enable it.",
};

const DEMO_LISTING: ActionResult = {
  ok: false,
  message: "This is a demonstration listing, so there is no real seller to contact. Enquiries work on genuine listings.",
};

const BOT: ActionResult = { ok: false, message: "Your submission could not be verified. Please wait a moment and try again." };

function dbError(message: string | undefined, fallback: string): ActionResult {
  if (message?.includes("Too many")) return { ok: false, message: "You have sent several requests recently. Please try again later." };
  if (message?.includes("not available")) return { ok: false, message: "This vehicle is no longer accepting enquiries." };
  if (message?.includes("own listing")) return { ok: false, message: "You cannot enquire about your own listing." };
  if (message?.includes("inspection")) return { ok: false, message: "This seller has not enabled inspection requests." };
  return { ok: false, message: fallback };
}

async function isDemoVehicle(vehicleId: string): Promise<boolean> {
  return vehicleId.startsWith("d0000000-");
}

export async function submitEnquiry(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (looksAutomated(fd)) return BOT;
  const parsed = enquirySchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (await isDemoVehicle(parsed.data.vehicleId)) return DEMO_LISTING;
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("enquiry", 8, 60 * 60 * 1000))) return { ok: false, message: "Too many enquiries from your network. Please try again later." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const d = parsed.data;
  const { error } = await supabase.from("enquiries").insert({
    vehicle_id: d.vehicleId,
    seller_id: "00000000-0000-0000-0000-000000000000", // replaced by the database from the vehicle record
    buyer_id: auth.user?.id ?? null,
    name: d.name,
    email: d.email,
    phone: d.phone,
    preferred_contact: d.preferredContact,
    message: d.message,
  });
  if (error) return dbError(error.message, "We couldn't send your enquiry. Please try again.");
  return { ok: true, message: "Your enquiry has been sent. The seller will reply using the contact details you provided." };
}

export async function requestInspection(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (looksAutomated(fd)) return BOT;
  const parsed = inspectionSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (await isDemoVehicle(parsed.data.vehicleId)) return DEMO_LISTING;
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("inspection", 6, 60 * 60 * 1000))) return { ok: false, message: "Too many requests from your network. Please try again later." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const d = parsed.data;
  const { error } = await supabase.from("inspection_requests").insert({
    vehicle_id: d.vehicleId,
    seller_id: "00000000-0000-0000-0000-000000000000",
    buyer_id: auth.user?.id ?? null,
    name: d.name,
    email: d.email,
    phone: d.phone,
    preferred_date: d.preferredDate,
    inspector: d.inspector,
    message: d.message,
  });
  if (error) return dbError(error.message, "We couldn't send your inspection request. Please try again.");
  return { ok: true, message: "Inspection request sent. The seller will contact you to arrange an independent inspection." };
}

export async function reportListing(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (looksAutomated(fd, 1500)) return BOT;
  const parsed = reportSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (await isDemoVehicle(parsed.data.vehicleId)) {
    return { ok: false, message: "This is a demonstration listing. Reports can be submitted for genuine listings." };
  }
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("report", 10, 60 * 60 * 1000))) return { ok: false, message: "Too many reports from your network. Please try again later." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const d = parsed.data;
  const { error } = await supabase.from("listing_reports").insert({
    vehicle_id: d.vehicleId,
    reporter_id: auth.user?.id ?? null,
    reason: d.reason,
    details: d.details,
    contact_email: d.contactEmail,
  });
  if (error) return dbError(error.message, "We couldn't submit your report. Please try again.");
  return { ok: true, message: "Thank you. Our team will review this listing." };
}

export async function sendContactMessage(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (looksAutomated(fd)) return BOT;
  const parsed = contactSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("contact", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many messages from your network. Please try again later." };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);
  if (error) return dbError(error.message, "We couldn't send your message. Please try again.");
  return { ok: true, message: "Thanks — your message has reached the MOTION X team." };
}

export async function recordView(vehicleId: string): Promise<void> {
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(vehicleId) || vehicleId.startsWith("d0000000-")) return;
  if (!(await rateLimit("view", 120, 60 * 60 * 1000))) return;
  const supabase = await createClient();
  await supabase.rpc("record_vehicle_view", { p_vehicle_id: vehicleId });
}
