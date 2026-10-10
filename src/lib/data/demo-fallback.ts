import "server-only";
import { cache } from "react";
import { shouldUseBuiltInDemo } from "@/lib/demo-mode";
import { demoInventoryEnabled, isSupabaseConfigured } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase/server";

let announced = false;

/**
 * True when inventory reads should use the built-in demonstration data instead
 * of the database (rules in shouldUseBuiltInDemo). Evaluated once per request.
 *
 * In development with Supabase configured, it counts public listings first. A
 * failing count throws — a database error is never replaced by demo data.
 */
export const builtInDemoActive = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;
  // Production builds inline NODE_ENV, so this branch is removed from them entirely.
  if (process.env.NODE_ENV !== "development" || !demoInventoryEnabled()) return false;

  const { count, error } = await (await getPublicClient())
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "sold"]);
  if (error) throw new Error(`Inventory check failed: ${error.message}`);

  const active = shouldUseBuiltInDemo({
    supabaseConfigured: true,
    demoFlag: true,
    nodeEnv: process.env.NODE_ENV,
    publicVehicleCount: count ?? 0,
  });
  if (active && !announced) {
    announced = true;
    console.info(
      "[demo] Supabase has no public listings — showing the built-in, clearly labelled demonstration inventory " +
        "(development only; NEXT_PUBLIC_SHOW_DEMO_INVENTORY=true). Real listings replace it as soon as one is published.",
    );
  }
  return active;
});
