/**
 * Public configuration (safe for the browser). Server-only secrets are read in
 * `src/lib/supabase/admin.ts` and never imported by client code.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "",
  plausibleSrc: process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}

/** Demonstration inventory is shown only when explicitly enabled or when no database is configured. */
export function demoInventoryEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_SHOW_DEMO_INVENTORY;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return !isSupabaseConfigured();
}

export function storagePublicUrl(bucket: string, path: string): string {
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
