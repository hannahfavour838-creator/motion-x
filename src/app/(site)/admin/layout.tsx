import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Session-dependent: always render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Admin · MOTION X" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const [{ count: pending }, { count: reports }, { count: verifications }, { count: messages }] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("listing_reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  return (
    <AppShell
      subtitle="Administration"
      title={user.displayName}
      nav={[
        { href: "/admin", label: "Overview", exact: true },
        { href: "/admin/listings", label: "Listing review", badge: pending ?? 0 },
        { href: "/admin/reports", label: "Reports", badge: reports ?? 0 },
        { href: "/admin/verifications", label: "Verification", badge: verifications ?? 0 },
        { href: "/admin/sellers", label: "Accounts" },
        { href: "/admin/messages", label: "Contact messages", badge: messages ?? 0 },
        { href: "/admin/log", label: "Moderation log" },
      ]}
    >
      {children}
    </AppShell>
  );
}
