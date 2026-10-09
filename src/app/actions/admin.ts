"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

/**
 * Every admin action re-verifies the caller server-side. The database applies
 * the same rule independently (RLS policies + guards call public.is_admin()),
 * so a forged request from a non-admin session changes nothing.
 */
async function adminContext() {
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  if (!user?.isAdmin) return null;
  return { user, supabase: await createClient() };
}

const DENIED: ActionResult = { ok: false, message: "Administrator access required." };
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

async function log(supabase: Awaited<ReturnType<typeof createClient>>, actorId: string, target_type: string, target_id: string, action: string, note?: string | null) {
  await supabase.from("moderation_actions").insert({ actor_id: actorId, target_type, target_id, action, note: note || null });
}

export type ListingDecision = "approve" | "reject" | "suspend" | "reinstate" | "feature" | "unfeature" | "inspected" | "history_checked" | "clear_evidence";

export async function moderateListing(id: string, decision: ListingDecision, note?: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  if (!uuid(id)) return { ok: false, message: "Invalid listing." };
  const reason = note?.trim().slice(0, 1000) || null;
  const { data: v } = await ctx.supabase.from("vehicles").select("id, status, approved_at, slug").eq("id", id).maybeSingle();
  if (!v) return { ok: false, message: "Listing not found." };

  let patch: Record<string, unknown> = {};
  switch (decision) {
    case "approve":
      patch = { status: "active", rejection_reason: null };
      break;
    case "reject":
      if (!reason) return { ok: false, message: "Explain what the seller needs to change." };
      patch = { status: "rejected", rejection_reason: reason };
      break;
    case "suspend":
      if (!reason) return { ok: false, message: "Give a reason for the suspension." };
      patch = { status: "suspended", rejection_reason: reason };
      break;
    case "reinstate":
      patch = { status: v.approved_at ? "paused" : "pending_review", rejection_reason: null };
      break;
    case "feature":
      patch = { featured: true };
      break;
    case "unfeature":
      patch = { featured: false };
      break;
    case "inspected":
      if (!reason) return { ok: false, message: "Record the inspection provider and report reference." };
      patch = { inspected_at: new Date().toISOString(), inspection_note: reason };
      break;
    case "history_checked":
      if (!reason) return { ok: false, message: "Record the history-check provider and reference." };
      patch = { history_checked_at: new Date().toISOString(), history_check_note: reason };
      break;
    case "clear_evidence":
      patch = { inspected_at: null, inspection_note: null, history_checked_at: null, history_check_note: null };
      break;
  }
  const { error } = await ctx.supabase.from("vehicles").update(patch).eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };
  if (!["approve", "reject", "suspend", "reinstate"].includes(decision)) await log(ctx.supabase, ctx.user.id, "vehicle", id, decision, reason);
  revalidatePath("/admin", "layout");
  revalidatePath(`/cars/${v.slug}`);
  revalidatePath("/");
  return { ok: true, message: "Listing updated." };
}

export async function resolveReport(id: string, status: "reviewing" | "resolved" | "dismissed", note?: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  if (!uuid(id)) return { ok: false, message: "Invalid report." };
  const done = status !== "reviewing";
  const { error } = await ctx.supabase
    .from("listing_reports")
    .update({ status, resolution_note: note?.trim() || null, resolved_by: done ? ctx.user.id : null, resolved_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, message: "Update failed." };
  await log(ctx.supabase, ctx.user.id, "report", id, `report_${status}`, note);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Report updated." };
}

export async function setAccountStatus(profileId: string, status: "active" | "suspended", reason?: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  if (!uuid(profileId)) return { ok: false, message: "Invalid account." };
  if (profileId === ctx.user.id) return { ok: false, message: "You cannot suspend your own account." };
  if (status === "suspended" && !reason?.trim()) return { ok: false, message: "Give a reason for the suspension." };
  const { error } = await ctx.supabase.from("profiles").update({ status, suspended_reason: status === "suspended" ? reason!.trim() : null }).eq("id", profileId);
  if (error) return { ok: false, message: "Update failed." };
  await log(ctx.supabase, ctx.user.id, "profile", profileId, status === "suspended" ? "account_suspended" : "account_reinstated", reason);
  revalidatePath("/admin", "layout");
  return { ok: true, message: status === "suspended" ? "Account suspended — their listings are hidden." : "Account reinstated." };
}

export async function revokeIdentityVerification(profileId: string, reason: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  const { error } = await ctx.supabase.from("profiles").update({ identity_verified_at: null }).eq("id", profileId);
  if (error) return { ok: false, message: "Update failed." };
  await log(ctx.supabase, ctx.user.id, "profile", profileId, "identity_verification_revoked", reason);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Identity verification revoked." };
}

export async function reviewVerification(id: string, decision: "approved" | "rejected", note?: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  if (!uuid(id)) return { ok: false, message: "Invalid request." };
  if (decision === "rejected" && !note?.trim()) return { ok: false, message: "Tell the applicant why the request was declined." };
  const { error } = await ctx.supabase.from("verification_requests").update({ status: decision, reviewer_note: note?.trim() || null, reviewed_by: ctx.user.id }).eq("id", id).eq("status", "pending");
  if (error) return { ok: false, message: "Update failed." };
  await log(ctx.supabase, ctx.user.id, "verification", id, `verification_${decision}`, note);
  revalidatePath("/admin", "layout");
  return { ok: true, message: decision === "approved" ? "Verified — the badge is now live." : "Request declined." };
}

export async function setModerationMode(mode: "required" | "auto"): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  const { error } = await ctx.supabase.from("platform_settings").update({ value: mode, updated_at: new Date().toISOString() }).eq("key", "listing_moderation");
  if (error) return { ok: false, message: "Update failed." };
  revalidatePath("/admin", "layout");
  return { ok: true, message: mode === "required" ? "New listings now require review." : "New listings now publish immediately." };
}

export async function markContactHandled(id: string): Promise<ActionResult> {
  const ctx = await adminContext();
  if (!ctx) return DENIED;
  const { error } = await ctx.supabase.from("contact_messages").update({ status: "handled" }).eq("id", id);
  if (error) return { ok: false, message: "Update failed." };
  revalidatePath("/admin/messages");
  return { ok: true, message: "Marked as handled." };
}
