/**
 * When does MOTION X show its built-in demonstration inventory?
 *
 *  - Preview mode (Supabase not configured): always — unchanged behaviour.
 *  - Supabase configured: only while the database has NO public listings, and
 *    only if explicitly enabled by one of:
 *      · the development fallback — `next dev` + NEXT_PUBLIC_SHOW_DEMO_INVENTORY=true
 *      · public demo mode — SHOW_PUBLIC_DEMO_INVENTORY=true (server-only; any
 *        environment, e.g. a portfolio deployment). Off unless set to "true".
 *    Real listings always take priority: once one is public, the database is
 *    used exclusively, so demo and real vehicles are never mixed or duplicated.
 *    An unknown count (failed check) never activates demo data.
 *
 * Pure function so the rules can be unit-tested.
 */
export function shouldUseBuiltInDemo(input: {
  supabaseConfigured: boolean;
  demoFlag: boolean;
  publicDemoFlag?: boolean;
  nodeEnv: string | undefined;
  publicVehicleCount: number | null;
}): boolean {
  if (!input.supabaseConfigured) return true;
  if (input.publicVehicleCount !== 0) return false;
  const devFallback = input.nodeEnv === "development" && input.demoFlag;
  return devFallback || input.publicDemoFlag === true;
}

/** Public demo mode switch. Exactly "true" enables it; anything else (or unset) leaves it off. */
export const publicDemoFlagFrom = (value: string | undefined) => value === "true";

/** IDs and slugs of the built-in demonstration records (see src/lib/demo/inventory.ts). */
export const isDemoVehicleId = (id: string) => id.startsWith("d0000000-");
export const isDemoSellerId = (id: string) => id.startsWith("de000000-");
export const isDemoDealerSlug = (slug: string) => slug.startsWith("demo-dealer-");
