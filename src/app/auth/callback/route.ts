import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";


/**
 * Completes email confirmation, magic-link and password-recovery flows.
 * Supports both PKCE (`?code=`) and token-hash (`?token_hash=&type=`) links.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeRedirectPath(url.searchParams.get("next"), "/account");
  const fail = new URL("/sign-in?error=link", url.origin);
  if (!isSupabaseConfigured()) return NextResponse.redirect(fail);

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, url.origin));
  }
  return NextResponse.redirect(fail);
}
