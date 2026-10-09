import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { ReportControls } from "@/components/admin/admin-controls";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/validation";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const sp = await searchParams;
  const showAll = sp.view === "all";
  const supabase = await createClient();
  let q = supabase.from("listing_reports").select("*, vehicle:vehicles(id, slug, make, model, year, status)").order("created_at", { ascending: false }).limit(200);
  if (!showAll) q = q.in("status", ["open", "reviewing"]);
  const { data: reports } = await q;
  return (
    <>
      <PageHeader title="Reports" description="Reports from visitors and members. Suspend the listing from its review page if a report is upheld." actions={<Link href={showAll ? "/admin/reports" : "/admin/reports?view=all"} className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-silver hover:text-white">{showAll ? "Open only" : "Show all"}</Link>} />
      {!reports?.length ? <EmptyState title="No open reports" /> : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const v = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
            return (
              <li key={r.id} className="border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white">{REPORT_REASONS[r.reason as keyof typeof REPORT_REASONS] ?? r.reason}</p>
                    <p className="mt-1 text-xs text-dim">{formatRelative(r.created_at)}{r.reporter_id ? " · signed-in member" : " · anonymous"}{r.contact_email ? ` · ${r.contact_email}` : ""}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {v && <Link href={`/admin/listings/${v.id}`} className="mt-3 block text-sm text-silver underline underline-offset-4 hover:text-white">{v.year} {v.make} {v.model} ({v.status})</Link>}
                {r.details && <p className="mt-3 whitespace-pre-line text-sm text-muted">{r.details}</p>}
                {r.resolution_note && <p className="mt-3 text-xs text-dim">Resolution: {r.resolution_note}</p>}
                <div className="mt-4"><ReportControls id={r.id} status={r.status} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
