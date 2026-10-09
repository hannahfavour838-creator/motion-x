import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireSeller } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Session-dependent: always render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Seller dashboard", template: "%s · Seller dashboard · MOTION X" }, robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireSeller();
  const supabase = await createClient();
  const [{ count: newEnquiries }, { count: newInspections }] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "new"),
    supabase.from("inspection_requests").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "requested"),
  ]);
  const isDealer = user.accountType === "dealer";
  return (
    <AppShell
      subtitle={isDealer ? "Dealership" : "Private seller"}
      title={user.displayName}
      nav={[
        { href: "/dashboard", label: "Overview", exact: true },
        { href: "/dashboard/listings", label: "Listings" },
        { href: "/dashboard/enquiries", label: "Enquiries", badge: newEnquiries ?? 0 },
        { href: "/dashboard/inspections", label: "Inspection requests", badge: newInspections ?? 0 },
        { href: "/dashboard/profile", label: isDealer ? "Storefront" : "Public profile" },
        { href: "/dashboard/verification", label: "Verification" },
        { href: "/account/settings", label: "Account settings" },
      ]}
      footer={
        isDealer && user.dealerSlug ? (
          <Link href={`/dealers/${user.dealerSlug}`} className="block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-silver hover:text-white">View storefront →</Link>
        ) : (
          <Link href={`/sellers/${user.id}`} className="block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-silver hover:text-white">View public profile →</Link>
        )
      }
    >
      {user.status === "suspended" && (
        <div className="mb-8 border border-danger/40 bg-danger/[0.05] px-4 py-3 text-sm text-danger" role="alert">
          Your account is suspended. Your listings are hidden and you cannot publish new ones. Contact support for help.
        </div>
      )}
      {isDealer && !user.hasDealerProfile && (
        <div className="mb-8 flex flex-col gap-3 border border-electric/30 bg-electric/[0.05] px-4 py-4 text-sm text-silver md:flex-row md:items-center md:justify-between">
          <span>Complete your dealership profile to create your public storefront.</span>
          <Link href="/dashboard/onboarding" className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-white underline underline-offset-4">Set up storefront →</Link>
        </div>
      )}
      {children}
    </AppShell>
  );
}
