import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireUser } from "@/lib/auth";
import { getEnquiries } from "@/lib/data/account";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "My enquiries" };

export default async function MyEnquiriesPage() {
  const user = await requireUser("/account/enquiries");
  const enquiries = await getEnquiries("buyer", user.id);
  return (
    <>
      <PageHeader title="My enquiries" description="Enquiries you sent while signed in, and any replies from sellers." />
      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries yet">When you contact a seller while signed in, the conversation appears here.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {enquiries.map((e) => (
            <li key={e.id}>
              <Link href={`/account/enquiries/${e.id}`} className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-ink">
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{e.vehicle ? `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` : "Listing removed"}</span>
                  <span className="block truncate text-xs text-muted">{formatRelative(e.created_at)} — {e.message}</span>
                </span>
                <StatusBadge status={e.status === "read" ? "new" : e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
