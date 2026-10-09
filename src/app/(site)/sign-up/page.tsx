import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/forms/auth-forms";
import { AuthShell } from "@/components/layout/auth-shell";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Join MOTION X as a buyer, private seller or dealership.",
  robots: { index: false },
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(user.accountType === "buyer" ? "/account" : "/dashboard");
  const type = sp.type === "dealer" ? "dealer" : sp.type === "seller" ? "private_seller" : "buyer";
  return (
    <AuthShell
      eyebrow="Join MOTION X"
      title={type === "dealer" ? "Register your dealership" : "Create your account"}
      footer={<>Already have an account? <Link href="/sign-in" className="text-white underline underline-offset-4">Sign in</Link></>}
    >
      <SignUpForm initialType={type} disabled={!isSupabaseConfigured()} />
    </AuthShell>
  );
}
