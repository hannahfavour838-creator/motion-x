import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Session-aware client for Server Components, Server Actions and Route
 * Handlers. Every query runs as the signed-in user, so Row Level Security is
 * the final authority on what can be read or written.
 */
export async function createClient(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component — the proxy refreshes sessions instead.
        }
      },
    },
  });
}

let publicClient: SupabaseClient | null = null;

/**
 * Anonymous client for public, cacheable reads (marketplace, storefronts).
 * It never carries a session, so it only sees what RLS exposes publicly.
 */
export function createPublicClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  publicClient ??= createPlainClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}
