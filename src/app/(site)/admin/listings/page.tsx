import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/misc";
import { ListingModeration } from "@/components/admin/admin-controls";
import { ListingStatusBadge } from "@/components/dashboard/status-badge";
import { LABELS, LISTING_STATUSES, type ListingStatus } from "@/config/vehicles";
import { countryName } from "@/config/markets";
import { requireAdmin } from "@/lib/auth";
import { mapVehicle, VEHICLE_SELECT } from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
import { cn, formatPrice, formatRelative } from "@/lib/format";

export const metadata = { title: "Listing review" };

export default async function AdminListings({ searchParams }: PageProps<"/admin/listings">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (LISTING_STATUSES as readonly string[]).includes(String(sp.status)) ? (sp.status as ListingStatus) : sp.status === "all" ? null : "pending_review";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const supabase = await createClient();
  let query = supabase.from("vehicles").select(VEHICLE_SELECT).order(status === "pending_review" ? "submitted_at" : "updated_at", { ascending: status === "pending_review" }).limit(100);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`make.ilike.%${q.replace(/[%,()]/g, "")}%,model.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  const vehicles = (data ?? []).map(mapVehicle);
  const tabs: (ListingStatus | "all")[] = ["pending_review", "active", "rejected", "suspended", "paused", "sold", "draft", "all"];
  return (
    <>
      <PageHeader title="Listing review" description="Oldest submissions first. Approving publishes the listing; requesting changes notifies the seller with your note." />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none" aria-label="Status">
          {tabs.map((t) => (
            <Link key={t} href={`/admin/listings?status=${t}`} aria-current={(status ?? "all") === t ? "page" : undefined} className={cn("shrink-0 border px-3 py-2 text-xs", (status ?? "all") === t ? "border-white text-white" : "border-line text-muted hover:text-white")}>
              {t === "all" ? "All" : LABELS.status[t]}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" action="/admin/listings">
          <input type="hidden" name="status" value={status ?? "all"} />
          <label className="sr-only" htmlFor="aq">Search make or model</label>
          <input id="aq" name="q" defaultValue={q} placeholder="Make or model" className="h-9 w-48 border border-line bg-charcoal px-3 text-sm focus:border-electric focus:outline-none" />
        </form>
      </div>
      {vehicles.length === 0 ? (
        <EmptyState title="Queue is clear">No listings match this view.</EmptyState>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {vehicles.map((v) => (
            <li key={v.id} className="grid gap-4 p-4 lg:grid-cols-[8rem_1fr]">
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-charcoal lg:w-32">
                {v.images[0] ? <Image src={v.images[0].url} alt="" fill sizes="128px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-[0.6rem] uppercase text-danger">No photos</span>}
              </div>
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusBadge status={v.status} />
                  {v.isDemo && <span className="text-xs text-warning">Demo</span>}
                  {v.featured && <span className="text-xs text-electric">Featured</span>}
                  <span className="text-xs text-dim">Updated {formatRelative(v.updatedAt)} · {v.images.length} photos</span>
                </div>
                <Link href={`/admin/listings/${v.id}`} className="block font-display text-base uppercase tracking-wide text-white hover:text-electric">{v.year} {v.make} {v.model} {v.variant}</Link>
                <p className="text-sm text-muted">{formatPrice(v.price, v.currency)} {v.currency} · {v.city}, {countryName(v.countryCode)} · {v.seller.displayName} ({LABELS.sellerType[v.seller.type]})</p>
                <ListingModeration id={v.id} status={v.status} featured={v.featured} hasEvidence={Boolean(v.inspectedAt || v.historyCheckedAt)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
