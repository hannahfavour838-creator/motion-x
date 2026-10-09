import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
import { FormMessage } from "@/components/ui/form";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const user = await getSessionUser();
  if (user) redirect(next ?? (user.isAdmin ? "/admin" : user.accountType === "buyer" ? "/account" : "/dashboard"));
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      footer={<>New to MOTION X? <Link href="/sign-up" className="text-white underline underline-offset-4">Create an account</Link></>}
    >
      {sp.error === "link" && <div className="mb-6"><FormMessage>That link is invalid or has expired. Please sign in or request a new link.</FormMessage></div>}
      <SignInForm next={next} disabled={!isSupabaseConfigured()} />
    </AuthShell>
  );
}
