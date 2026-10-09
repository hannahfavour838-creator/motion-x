import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireSeller } from "@/lib/auth";
import { getEnquiries } from "@/lib/data/account";
import { cn, formatRelative } from "@/lib/format";

export const metadata = { title: "Enquiries" };
const FILTERS = ["new", "read", "replied", "closed", "spam"] as const;

export default async function EnquiriesPage({ searchParams }: PageProps<"/dashboard/enquiries">) {
  const user = await requireSeller("/dashboard/enquiries");
  const sp = await searchParams;
  const status = FILTERS.find((f) => f === sp.status);
  const enquiries = await getEnquiries("seller", user.id, status);
  return (
    <>
      <PageHeader title="Enquiries" description="Messages from buyers about your listings. Buyer contact details are visible only to you." />
      <nav aria-label="Filter enquiries" className="mb-6 flex gap-1 overflow-x-auto scrollbar-none">
        {[undefined, ...FILTERS].map((f) => (
          <Link key={f ?? "all"} href={f ? `/dashboard/enquiries?status=${f}` : "/dashboard/enquiries"} aria-current={status === f ? "page" : undefined}
            className={cn("shrink-0 border px-3 py-2 text-xs capitalize", status === f ? "border-white text-white" : "border-line text-muted hover:text-white")}>
            {f ?? "All"}
          </Link>
        ))}
      </nav>
      {enquiries.length === 0 ? (
        <EmptyState title="No enquiries">When buyers contact you about a listing, their messages appear here.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {enquiries.map((e) => (
            <li key={e.id}>
              <Link href={`/dashboard/enquiries/${e.id}`} className={cn("grid gap-2 px-4 py-4 transition-colors hover:bg-ink md:grid-cols-[1fr_auto] md:items-center", e.status === "new" && "bg-electric/[0.03]")}>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {e.status === "new" && <span className="h-1.5 w-1.5 rounded-full bg-electric" aria-label="Unread" />}
                    <span className="truncate text-sm text-white">{e.name}</span>
                    <span className="text-xs text-dim">· {formatRelative(e.created_at)}</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">{e.vehicle ? `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` : "Listing"} — {e.message}</span>
                </span>
                <StatusBadge status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
