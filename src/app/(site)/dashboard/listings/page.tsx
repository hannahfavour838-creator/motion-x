import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ListingActions } from "@/components/dashboard/listing-actions";
import { ListingStatusBadge } from "@/components/dashboard/status-badge";
import { LABELS, LISTING_STATUSES, type ListingStatus } from "@/config/vehicles";
import { requireSeller } from "@/lib/auth";
import { getMyListings } from "@/lib/data/account";
import { cn, formatPrice, formatRelative, localeFor } from "@/lib/format";

export const metadata = { title: "Listings" };

export default async function ListingsPage({ searchParams }: PageProps<"/dashboard/listings">) {
  const user = await requireSeller("/dashboard/listings");
  const sp = await searchParams;
  const filter = (LISTING_STATUSES as readonly string[]).includes(String(sp.status)) ? (sp.status as ListingStatus) : null;
  const all = await getMyListings(user.id);
  const listings = filter ? all.filter((l) => l.status === filter) : all;
  const tabs: (ListingStatus | null)[] = [null, "active", "pending_review", "draft", "paused", "sold", "rejected"];

  return (
    <>
      <PageHeader title="Listings" description="Create, edit and manage the lifecycle of your vehicles." actions={<ButtonLink href="/dashboard/listings/new" iconRight={<ArrowRight />}>New listing</ButtonLink>} />
      <nav aria-label="Filter by status" className="-mx-1 mb-6 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const n = t ? all.filter((l) => l.status === t).length : all.length;
          const active = filter === t;
          return (
            <Link key={t ?? "all"} href={t ? `/dashboard/listings?status=${t}` : "/dashboard/listings"} aria-current={active ? "page" : undefined}
              className={cn("shrink-0 border px-3 py-2 text-xs transition-colors", active ? "border-white text-white" : "border-line text-muted hover:text-white")}>
              {t ? LABELS.status[t] : "All"} <span className="ml-1 font-mono text-dim">{n}</span>
            </Link>
          );
        })}
      </nav>
      {listings.length === 0 ? (
        <EmptyState title={filter ? "Nothing here" : "No listings yet"} action={<ButtonLink href="/dashboard/listings/new">Create a listing</ButtonLink>} />
      ) : (
        <ul className="divide-y divide-line border border-line">
          {listings.map((l) => (
            <li key={l.id} className="grid gap-4 p-4 md:grid-cols-[7rem_1fr_auto] md:items-center">
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-charcoal md:w-28">
                {l.images[0] ? <Image src={l.images[0].url} alt="" fill sizes="112px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-widest text-dim">No photo</span>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusBadge status={l.status} />
                  <span className="text-xs text-dim">Updated {formatRelative(l.updatedAt)}</span>
                </div>
                <Link href={`/dashboard/listings/${l.id}/edit`} className="mt-2 block truncate font-display text-base uppercase tracking-wide text-white hover:text-electric">
                  {l.year} {l.make} {l.model} {l.variant && <span className="normal-case text-muted">· {l.variant}</span>}
                </Link>
                <p className="mt-1 text-sm text-silver">{formatPrice(l.price, l.currency, localeFor(l.countryCode))} <span className="text-xs text-dim">{l.currency}</span></p>
                <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-dim">
                  {l.stats.views} views · {l.stats.views30d} in 30 days · {l.stats.saves} saves · {l.stats.enquiries} enquiries · {l.images.length} photos
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <ListingActions id={l.id} status={l.status} compact />
                <div className="flex gap-4">
                  <Link href={`/dashboard/listings/${l.id}/edit`} className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver hover:text-white">Edit</Link>
                  <Link href={`/cars/${l.slug}`} className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-silver hover:text-white">{l.status === "active" ? "View" : "Preview"}</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
