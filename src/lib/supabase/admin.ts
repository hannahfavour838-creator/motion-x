import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses Row Level Security, so it is used ONLY for:
 *   - the exchange-rate refresh (cron, CRON_SECRET-protected), and
 *   - recordView(), which calls exactly one fixed function
 *     (record_vehicle_view) with a validated UUID after a per-IP limit.
 * Never pass user input to other queries through it, and never import it from
 * components or client code.
 */
export function createServiceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!publicEnv.supabaseUrl || !key) return null;
  return createClient(publicEnv.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
