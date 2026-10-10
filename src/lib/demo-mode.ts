/**
 * When does MOTION X show its built-in demonstration inventory?
 *
 *  - Preview mode (Supabase not configured): always — unchanged behaviour.
 *  - Supabase configured: ONLY during local development (`next dev`), ONLY when
 *    NEXT_PUBLIC_SHOW_DEMO_INVENTORY=true, and ONLY while the database has no
 *    public listings. Production builds never use it, and the moment a real
 *    listing is published the database takes over.
 *
 * Pure function so the rules can be unit-tested.
 */
export function shouldUseBuiltInDemo(input: {
  supabaseConfigured: boolean;
  demoFlag: boolean;
  nodeEnv: string | undefined;
  publicVehicleCount: number | null;
}): boolean {
  if (!input.supabaseConfigured) return true;
  return input.nodeEnv === "development" && input.demoFlag && input.publicVehicleCount === 0;
}

/** IDs and slugs of the built-in demonstration records (see src/lib/demo/inventory.ts). */
export const isDemoVehicleId = (id: string) => id.startsWith("d0000000-");
export const isDemoSellerId = (id: string) => id.startsWith("de000000-");
export const isDemoDealerSlug = (slug: string) => slug.startsWith("demo-dealer-");
