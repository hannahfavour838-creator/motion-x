import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/lib/types";
import { mapVehicle, VEHICLE_SELECT } from "./mappers";

/* All functions here run with the caller's session; RLS restricts rows to what they may see. */

export interface ListingStats { views: number; views30d: number; saves: number; enquiries: number }

export async function getMyListings(sellerId: string): Promise<(Vehicle & { stats: ListingStats })[]> {
  const supabase = await createClient();
  const [{ data }, { data: stats }] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_SELECT).eq("seller_id", sellerId).order("updated_at", { ascending: false }),
    supabase.rpc("seller_listing_stats"),
  ]);
  const byId = new Map<string, ListingStats>(
    (stats ?? []).map((s: { vehicle_id: string; views_total: number; views_30d: number; saves: number; enquiries: number }) => [
      s.vehicle_id,
      { views: Number(s.views_total), views30d: Number(s.views_30d), saves: Number(s.saves), enquiries: Number(s.enquiries) },
    ]),
  );
  return (data ?? []).map((row) => {
    const v = mapVehicle(row);
    return { ...v, stats: byId.get(v.id) ?? { views: 0, views30d: 0, saves: 0, enquiries: 0 } };
  });
}

export async function getMyListing(sellerId: string, id: string): Promise<Vehicle | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select(VEHICLE_SELECT).eq("id", id).eq("seller_id", sellerId).maybeSingle();
  return data ? mapVehicle(data) : null;
}

export async function getListingHistory(vehicleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("moderation_actions")
    .select("id, action, from_status, to_status, note, created_at")
    .eq("target_type", "vehicle")
    .eq("target_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

export async function getViewsDaily(days = 30): Promise<{ day: string; views: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("seller_views_daily", { p_days: days });
  return (data ?? []).map((r: { day: string; views: number }) => ({ day: r.day, views: Number(r.views) }));
}

export interface EnquiryRow {
  id: string;
  vehicle_id: string;
  seller_id: string;
  buyer_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  preferred_contact: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  vehicle: { id: string; slug: string; make: string; model: string; year: number } | null;
}

const ENQUIRY_SELECT = "*, vehicle:vehicles(id, slug, make, model, year)";

export async function getEnquiries(role: "seller" | "buyer", userId: string, status?: string): Promise<EnquiryRow[]> {
  const supabase = await createClient();
  let q = supabase.from("enquiries").select(ENQUIRY_SELECT).eq(role === "seller" ? "seller_id" : "buyer_id", userId).order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as EnquiryRow[];
}

export async function getEnquiryThread(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const [{ data: enquiry }, { data: messages }] = await Promise.all([
    supabase.from("enquiries").select(ENQUIRY_SELECT).eq("id", id).maybeSingle(),
    supabase.from("enquiry_messages").select("id, sender_id, body, created_at").eq("enquiry_id", id).order("created_at"),
  ]);
  if (!enquiry) return null;
  return { enquiry: enquiry as EnquiryRow, messages: messages ?? [] };
}

export async function getInspectionRequests(sellerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inspection_requests")
    .select("*, vehicle:vehicles(id, slug, make, model, year)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getSavedVehicles(userId: string): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("favourites").select(`created_at, vehicle:vehicles(${VEHICLE_SELECT})`).eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map((r) => (Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle)).filter(Boolean).map(mapVehicle);
}

export async function getMyProfile(userId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: priv }, { data: dealer }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profile_private").select("phone").eq("id", userId).maybeSingle(),
    supabase.from("dealer_profiles").select("*").eq("id", userId).maybeSingle(),
  ]);
  return { profile, phone: priv?.phone ?? null, dealer };
}

export async function getMyVerificationRequests(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("verification_requests").select("id, kind, status, reviewer_note, created_at, reviewed_at").eq("profile_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}
