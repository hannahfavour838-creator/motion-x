import "server-only";
import { cache } from "react";
import { publicDemoFlagFrom, shouldUseBuiltInDemo } from "@/lib/demo-mode";
import { demoInventoryEnabled, isSupabaseConfigured } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase/server";

let announced = false;

/**
 * Public demo mode (server-only, read at request time). Enable in an
 * environment with SHOW_PUBLIC_DEMO_INVENTORY=true; off by default.
 */
export function publicDemoInventoryEnabled(): boolean {
  return publicDemoFlagFrom(process.env.SHOW_PUBLIC_DEMO_INVENTORY);
}

/**
 * True when inventory reads should use the built-in demonstration data instead
 * of the database (rules in shouldUseBuiltInDemo). Evaluated once per request.
 *
 * With Supabase configured it counts public listings first. A failing count
 * throws — a database error is never replaced by demo data.
 */
export const builtInDemoActive = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;
  const devFallback = process.env.NODE_ENV === "development" && demoInventoryEnabled();
  const publicDemo = publicDemoInventoryEnabled();
  if (!devFallback && !publicDemo) return false;

  const { count, error } = await (await getPublicClient())
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "sold"]);
  if (error) throw new Error(`Inventory check failed: ${error.message}`);

  const active = shouldUseBuiltInDemo({
    supabaseConfigured: true,
    demoFlag: demoInventoryEnabled(),
    publicDemoFlag: publicDemo,
    nodeEnv: process.env.NODE_ENV,
    publicVehicleCount: count ?? 0,
  });
  if (active && !announced) {
    announced = true;
    console.info(
      `[demo] Supabase has no public listings — showing the built-in, clearly labelled demonstration inventory (${
        publicDemo ? "SHOW_PUBLIC_DEMO_INVENTORY=true" : "development fallback"
      }). Real listings replace it as soon as one is published.`,
    );
  }
  return active;
});

/**
 * Inside a built-in-demo branch: may demonstration records be shown? In
 * preview mode this keeps honouring NEXT_PUBLIC_SHOW_DEMO_INVENTORY=false;
 * with Supabase configured, the branch is only reached when demo data was
 * explicitly enabled, so it is always true there.
 */
export function demoRecordsAllowed(): boolean {
  return isSupabaseConfigured() ? true : demoInventoryEnabled();
}
