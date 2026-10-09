import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
  accountType: "buyer" | "private_seller" | "dealer";
  displayName: string;
  status: "active" | "suspended";
  identityVerified: boolean;
  countryCode: string | null;
  city: string | null;
  isAdmin: boolean;
  hasDealerProfile: boolean;
  dealerSlug: string | null;
}

/**
 * Data Access Layer entry point: verifies the session with Supabase Auth and
 * loads the caller's own profile. Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;
  const [{ data: profile }, { data: isAdmin }, { data: dealer }] = await Promise.all([
    supabase.from("profiles").select("account_type, display_name, status, identity_verified_at, country_code, city").eq("id", user.id).maybeSingle(),
    supabase.rpc("is_admin"),
    supabase.from("dealer_profiles").select("slug").eq("id", user.id).maybeSingle(),
  ]);
  return {
    id: user.id,
    email: user.email ?? null,
    accountType: (profile?.account_type as SessionUser["accountType"]) ?? "buyer",
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Member",
    status: (profile?.status as SessionUser["status"]) ?? "active",
    identityVerified: Boolean(profile?.identity_verified_at),
    countryCode: profile?.country_code ? String(profile.country_code).trim() : null,
    city: profile?.city ?? null,
    isAdmin: Boolean(isAdmin),
    hasDealerProfile: Boolean(dealer),
    dealerSlug: dealer?.slug ?? null,
  };
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const path = next ?? (await headers()).get("x-mx-path") ?? "/account";
    redirect(`/sign-in?next=${encodeURIComponent(path.startsWith("/") ? path : "/account")}`);
  }
  return user;
}

export function isSeller(user: SessionUser | null): boolean {
  return Boolean(user && (user.accountType === "private_seller" || user.accountType === "dealer"));
}

export async function requireSeller(next?: string): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isSeller(user)) redirect("/sell/start");
  return user;
}

/** Admin pages 404 for everyone else so their existence is not advertised. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.isAdmin) notFound();
  return user;
}
