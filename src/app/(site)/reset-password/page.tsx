import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
import { requireUser } from "@/lib/auth";

// Session-dependent: always render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  await requireUser("/reset-password");
  return (
    <AuthShell eyebrow="Account recovery" title="New password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
