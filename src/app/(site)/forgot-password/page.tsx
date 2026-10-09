import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Account recovery" title="Reset password" footer={<Link href="/sign-in" className="text-white underline underline-offset-4">Back to sign in</Link>}>
      <p className="mb-6 text-sm leading-relaxed text-muted">Enter the email address you used to register and we&apos;ll send you a secure link to choose a new password.</p>
      <ForgotPasswordForm disabled={!isSupabaseConfigured()} />
    </AuthShell>
  );
}
