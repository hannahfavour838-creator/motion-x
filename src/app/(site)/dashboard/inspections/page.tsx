import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { InspectionControls } from "@/components/dashboard/enquiry-components";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireSeller } from "@/lib/auth";
import { getInspectionRequests } from "@/lib/data/account";
import { formatDate, formatRelative } from "@/lib/format";

export const metadata = { title: "Inspection requests" };

export default async function InspectionsPage() {
  const user = await requireSeller("/dashboard/inspections");
  const requests = await getInspectionRequests(user.id);
  return (
    <>
      <PageHeader
        title="Inspection requests"
        description="Buyers asking to arrange an independent pre-purchase inspection. MOTION X does not perform inspections; agree the time, place and inspector directly with the buyer."
      />
      {requests.length === 0 ? (
        <EmptyState title="No inspection requests">Enable “Allow inspection requests” on a listing to let buyers ask for one.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const v = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
            return (
              <li key={r.id} className="border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white">{r.name} <span className="text-xs text-dim">· {formatRelative(r.created_at)}</span></p>
                    {v && <Link href={`/cars/${v.slug}`} className="mt-1 block text-xs text-muted hover:text-white">{v.year} {v.make} {v.model}</Link>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-dim">Contact</dt><dd><a href={`mailto:${r.email}`} className="text-silver underline underline-offset-2">{r.email}</a>{r.phone && <span className="block text-silver">{r.phone}</span>}</dd></div>
                  <div><dt className="text-xs text-dim">Preferred date</dt><dd className="text-silver">{r.preferred_date ? formatDate(r.preferred_date) : "Flexible"}</dd></div>
                  <div><dt className="text-xs text-dim">Inspector</dt><dd className="text-silver">{r.inspector || "To be confirmed"}</dd></div>
                </dl>
                {r.message && <p className="mt-4 whitespace-pre-line text-sm text-muted">{r.message}</p>}
                <div className="mt-4"><InspectionControls id={r.id} status={r.status} /></div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
