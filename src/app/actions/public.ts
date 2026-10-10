"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { looksAutomated, rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isDemoVehicleId } from "@/lib/demo-mode";
import { submissionErrorMessage } from "@/lib/submission-errors";
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

function dbError(message: string | undefined, fallback: string, signedIn: boolean): ActionResult {
  return { ok: false, message: submissionErrorMessage(message, fallback, signedIn) };
}

/** Demonstration vehicles are fictional: no enquiries, inspections or reports. Checked before any database call. */
async function isDemoVehicle(vehicleId: string): Promise<boolean> {
  return isDemoVehicleId(vehicleId);
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
  if (error) return dbError(error.message, "We couldn't send your enquiry. Please try again.", Boolean(auth.user));
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
  if (error) return dbError(error.message, "We couldn't send your inspection request. Please try again.", Boolean(auth.user));
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
  if (error) return dbError(error.message, "We couldn't submit your report. Please try again.", Boolean(auth.user));
  return { ok: true, message: "Thank you. Our team will review this listing." };
}

export async function sendContactMessage(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (looksAutomated(fd)) return BOT;
  const parsed = contactSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  if (!(await rateLimit("contact", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many messages from your network. Please try again later." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("contact_messages").insert(parsed.data);
  if (error) return dbError(error.message, "We couldn't send your message. Please try again.", Boolean(auth.user));
  return { ok: true, message: "Thanks — your message has reached the MOTION X team." };
}

/**
 * Counts a listing view. record_vehicle_view is executable only by the service
 * role (migration …0300), so visitors cannot inflate counts by calling it
 * directly; this action applies a per-IP limit first. Without a service-role
 * key, views are simply not recorded.
 */
export async function recordView(vehicleId: string): Promise<void> {
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(vehicleId) || isDemoVehicleId(vehicleId)) return;
  if (!(await rateLimit("view", 120, 60 * 60 * 1000))) return;
  const service = createServiceClient();
  if (!service) return;
  await service.rpc("record_vehicle_view", { p_vehicle_id: vehicleId });
}
