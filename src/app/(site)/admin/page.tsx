import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/ui/misc";
import { ModerationModeToggle } from "@/components/admin/admin-controls";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: stats }, { data: setting }] = await Promise.all([
    supabase.rpc("admin_platform_stats"),
    supabase.from("platform_settings").select("value").eq("key", "listing_moderation").maybeSingle(),
  ]);
  const s = (stats ?? {}) as Record<string, number>;
  const mode = setting?.value === "auto" ? "auto" : "required";
  return (
    <>
      <PageHeader title="Platform overview" description="Live counts from the database. Demonstration listings are counted separately." />
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live listings" value={s.listings_live ?? 0} hint={`${s.listings_demo ?? 0} demonstration`} />
        <StatCard label="Awaiting review" value={s.listings_pending ?? 0} />
        <StatCard label="Open reports" value={s.reports_open ?? 0} />
        <StatCard label="Pending verifications" value={s.verifications_pending ?? 0} />
        <StatCard label="Sellers" value={s.sellers ?? 0} hint={`${s.dealers ?? 0} dealership storefronts`} />
        <StatCard label="Buyers" value={s.buyers ?? 0} />
        <StatCard label="Enquiries · 30 days" value={s.enquiries_30d ?? 0} />
      </div>
      <section className="mt-12 flex flex-col gap-4 border border-line p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg uppercase">Listing moderation</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">With review required, new listings and material edits wait for approval before going public. Enforced in the database.</p>
        </div>
        <ModerationModeToggle mode={mode} />
      </section>
    </>
  );
}
