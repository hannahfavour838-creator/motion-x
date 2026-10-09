import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { isSeller, requireUser } from "@/lib/auth";

// Session-dependent: always render per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Your account", template: "%s · Account · MOTION X" }, robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser();
  return (
    <AppShell
      subtitle="Your account"
      title={user.displayName}
      nav={[
        { href: "/account", label: "Overview", exact: true },
        { href: "/account/saved", label: "Saved vehicles" },
        { href: "/compare", label: "Compare" },
        { href: "/account/enquiries", label: "My enquiries" },
        { href: "/account/settings", label: "Settings" },
      ]}
      footer={
        isSeller(user) ? (
          <Link href="/dashboard" className="block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-silver hover:text-white">Seller dashboard →</Link>
        ) : user.isAdmin ? (
          <Link href="/admin" className="block font-mono text-[0.66rem] uppercase tracking-[0.18em] text-silver hover:text-white">Administration →</Link>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
