import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { VerificationControls } from "@/components/admin/admin-controls";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Verification" };

export default async function VerificationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("verification_requests")
    .select("*, profile:profiles!verification_requests_profile_id_fkey(id, display_name, account_type, created_at, dealer:dealer_profiles(business_name, slug, city, country_code))")
    .order("created_at", { ascending: false })
    .limit(200);
  const pending = (data ?? []).filter((r) => r.status === "pending");
  const done = (data ?? []).filter((r) => r.status !== "pending").slice(0, 30);
  return (
    <>
      <PageHeader
        title="Verification requests"
        description="Approve only after checking evidence through a secure channel (e.g. a companies registry or document check). Approval publishes a badge; it says nothing about vehicle condition."
      />
      {pending.length === 0 ? <EmptyState title="No pending requests" /> : (
        <ul className="space-y-3">
          {pending.map((r) => {
            const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
            const d = p && (Array.isArray(p.dealer) ? p.dealer[0] : p.dealer);
            const details = (r.details ?? {}) as Record<string, string>;
            return (
              <li key={r.id} className="border border-line p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="text-sm text-white"><span className="capitalize">{r.kind}</span> verification · {d?.business_name ?? p?.display_name}</p>
                  <span className="text-xs text-dim">{formatRelative(r.created_at)}</span>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(details).map(([k, v]) => <div key={k}><dt className="text-xs capitalize text-dim">{k.replace(/_/g, " ")}</dt><dd className="text-silver">{v}</dd></div>)}
                </dl>
                {r.applicant_note && <p className="mt-3 text-sm text-muted">{r.applicant_note}</p>}
                <div className="mt-4"><VerificationControls id={r.id} /></div>
              </li>
            );
          })}
        </ul>
      )}
      {done.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow mb-4">Recently reviewed</h2>
          <ul className="divide-y divide-line border border-line text-sm">
            {done.map((r) => {
              const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
              return <li key={r.id} className="flex justify-between gap-3 px-4 py-3"><span><span className="capitalize">{r.kind}</span> · {p?.display_name}{r.reviewer_note && <span className="block text-xs text-muted">{r.reviewer_note}</span>}</span><StatusBadge status={r.status} /></li>;
            })}
          </ul>
        </section>
      )}
    </>
  );
}
