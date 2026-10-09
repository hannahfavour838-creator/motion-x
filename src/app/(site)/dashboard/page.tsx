import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { EmptyState, StatCard } from "@/components/ui/misc";
import { ViewsChart } from "@/components/dashboard/views-chart";
import { ListingStatusBadge, StatusBadge } from "@/components/dashboard/status-badge";
import { requireSeller } from "@/lib/auth";
import { getEnquiries, getMyListings, getViewsDaily } from "@/lib/data/account";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireSeller();
  const [listings, enquiries, daily] = await Promise.all([getMyListings(user.id), getEnquiries("seller", user.id), getViewsDaily(30)]);
  const count = (s: string) => listings.filter((l) => l.status === s).length;
  const saves = listings.reduce((s, l) => s + l.stats.saves, 0);
  const needsAttention = listings.filter((l) => l.status === "rejected" || l.status === "draft" || (l.status === "active" && l.images.length === 0));
  const newEnquiries = enquiries.filter((e) => e.status === "new");

  return (
    <>
      <PageHeader
        eyebrow="Seller dashboard"
        title={`Welcome, ${user.displayName.split(" ")[0]}`}
        description="Every figure here comes from real activity on your listings."
        actions={<ButtonLink href="/dashboard/listings/new" iconRight={<ArrowRight />}>New listing</ButtonLink>}
      />
      {listings.length === 0 ? (
        <EmptyState title="Create your first listing" action={<ButtonLink href="/dashboard/listings/new">List a vehicle</ButtonLink>}>
          Add the vehicle details, upload photographs and submit it for review. Once approved it goes live in the marketplace.
        </EmptyState>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Live" value={count("active")} hint={`${count("paused")} paused`} />
            <StatCard label="Pending review" value={count("pending_review")} hint={`${count("draft")} drafts`} />
            <StatCard label="Sold" value={count("sold")} />
            <StatCard label="New enquiries" value={newEnquiries.length} hint={`${saves} saves across your listings`} />
          </div>
          <ViewsChart data={daily} />

          <div className="grid gap-10 xl:grid-cols-2">
            <section aria-labelledby="recent-enq">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="recent-enq" className="eyebrow">Recent enquiries</h2>
                <Link href="/dashboard/enquiries" className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-silver hover:text-white">All →</Link>
              </div>
              {enquiries.length ? (
                <ul className="divide-y divide-line border border-line">
                  {enquiries.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      <Link href={`/dashboard/enquiries/${e.id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-ink">
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white">{e.name}</span>
                          <span className="block truncate text-xs text-muted">{e.vehicle ? `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` : "Listing"} · {formatRelative(e.created_at)}</span>
                        </span>
                        <StatusBadge status={e.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border border-dashed border-line p-6 text-sm text-muted">No enquiries yet.</p>
              )}
            </section>
            <section aria-labelledby="attention">
              <h2 id="attention" className="eyebrow mb-4">Needs your attention</h2>
              {needsAttention.length ? (
                <ul className="divide-y divide-line border border-line">
                  {needsAttention.slice(0, 5).map((l) => (
                    <li key={l.id}>
                      <Link href={`/dashboard/listings/${l.id}/edit`} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-ink">
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-white">{l.year} {l.make} {l.model}</span>
                          <span className="block truncate text-xs text-muted">
                            {l.status === "rejected" ? l.rejectionReason ?? "Changes requested" : l.images.length === 0 ? "Add photographs" : "Finish and submit for review"}
                          </span>
                        </span>
                        <ListingStatusBadge status={l.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border border-dashed border-line p-6 text-sm text-muted">All listings are in good shape.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
