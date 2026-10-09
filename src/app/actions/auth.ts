"use server";

import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, formObject, signInSchema, signUpSchema } from "@/lib/validation";
import { z } from "zod";

const NOT_CONFIGURED: ActionResult = { ok: false, message: "Accounts are not available in this preview because Supabase is not configured." };

/** Only allow same-site relative redirects. */
function safeNext(next: unknown, fallback: string): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : fallback;
}

function authMessage(code: string | undefined, message: string | undefined): string {
  const m = (message || "").toLowerCase();
  if (code === "invalid_credentials" || m.includes("invalid login")) return "That email and password combination is not recognised.";
  if (code === "email_not_confirmed" || m.includes("not confirmed")) return "Please confirm your email address first — check your inbox for the link we sent.";
  if (code === "user_already_exists" || m.includes("already registered")) return "An account with this email already exists. Try signing in instead.";
  if (code === "weak_password" || m.includes("password")) return "Please choose a stronger password (at least 10 characters, not commonly used).";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || m.includes("rate limit")) return "Too many attempts. Please wait a few minutes and try again.";
  return "Something went wrong. Please try again.";
}

export async function signIn(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = signInSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await rateLimit("sign-in", 10, 15 * 60 * 1000))) return { ok: false, message: "Too many sign-in attempts. Please wait a few minutes." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, message: authMessage(error?.code, error?.message) };
  const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", data.user.id).maybeSingle();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  const fallback = isAdmin ? "/admin" : profile?.account_type && profile.account_type !== "buyer" ? "/dashboard" : "/account";
  redirect(safeNext(fd.get("next"), fallback));
}

export async function signUp(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = signUpSchema.safeParse(formObject(fd));
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.accountType === "dealer" && !parsed.data.businessName) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { businessName: "Enter your dealership's name" } };
  }
  if (!(await rateLimit("sign-up", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many sign-up attempts from your network. Please try later." };
  const d = parsed.data;
  const onboarding = d.accountType === "dealer" ? "/dashboard/onboarding" : d.accountType === "private_seller" ? "/dashboard" : "/account";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${siteConfig.url}/auth/callback?next=${encodeURIComponent(onboarding)}`,
      data: { display_name: d.displayName, account_type: d.accountType, business_name: d.businessName },
    },
  });
  if (error) return { ok: false, message: authMessage(error.code, error.message) };
  if (data.session) redirect(onboarding);
  return {
    ok: true,
    message: `We've sent a confirmation link to ${d.email}. Open it to activate your account${d.accountType === "dealer" ? " and set up your dealership" : ""}.`,
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const email = z.email().safeParse(String(fd.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { ok: false, message: "Enter a valid email address.", fieldErrors: { email: "Enter a valid email address" } };
  if (!(await rateLimit("reset", 5, 60 * 60 * 1000))) return { ok: false, message: "Too many requests. Please try again later." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${siteConfig.url}/auth/callback?next=/reset-password` });
  // Same response whether or not the account exists (prevents account enumeration).
  return { ok: true, message: "If an account exists for that email, you'll receive a link to reset your password shortly." };
}

export async function updatePassword(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 10) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { password: "Use at least 10 characters" } };
  if (password !== confirm) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { confirm: "Passwords do not match" } };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: authMessage(error.code, error.message) };
  return { ok: true, message: "Your password has been updated." };
}
