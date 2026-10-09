import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { Breadcrumbs } from "@/components/ui/misc";
import { ListingModeration } from "@/components/admin/admin-controls";
import { ListingStatusBadge, StatusBadge } from "@/components/dashboard/status-badge";
import { Gallery } from "@/components/vehicles/gallery";
import { SellerBadges } from "@/components/vehicles/seller-badges";
import { requireAdmin } from "@/lib/auth";
import { mapVehicle, VEHICLE_SELECT } from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Listing" };

export default async function AdminListing({ params }: PageProps<"/admin/listings/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, { data: history }, { data: reports }] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_SELECT).eq("id", id).maybeSingle(),
    supabase.from("moderation_actions").select("*").eq("target_type", "vehicle").eq("target_id", id).order("created_at", { ascending: false }),
    supabase.from("listing_reports").select("*").eq("vehicle_id", id).order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const v = mapVehicle(data);
  const { count: dupes } = await supabase.from("vehicles").select("id", { count: "exact", head: true })
    .eq("seller_id", v.seller.id).eq("make", v.make).eq("model", v.model).eq("year", v.year).neq("id", v.id);
  return (
    <>
      <Breadcrumbs items={[{ href: "/admin/listings", label: "Listing review" }, { label: `${v.make} ${v.model}` }]} />
      <div className="mt-6">
        <PageHeader title={`${v.year} ${v.make} ${v.model}`} description={<span className="flex flex-wrap items-center gap-3"><ListingStatusBadge status={v.status} /><Link href={`/cars/${v.slug}`} className="underline underline-offset-4">Open listing</Link></span>} />
      </div>
      <ListingModeration id={v.id} status={v.status} featured={v.featured} hasEvidence={Boolean(v.inspectedAt || v.historyCheckedAt)} />
      {(dupes ?? 0) > 0 && <p className="mt-6 border border-warning/30 bg-warning/[0.05] px-4 py-3 text-sm text-warning">Possible duplicate: this seller has {dupes} other listing(s) for a {v.year} {v.make} {v.model}.</p>}
      <div className="mt-8 grid gap-10 xl:grid-cols-[1.4fr_1fr]">
        <Gallery images={v.images} title={v.make} />
        <dl className="space-y-3 text-sm">
          <div><dt className="text-xs text-dim">Price</dt><dd>{formatPrice(v.price, v.currency)} {v.currency}</dd></div>
          <div><dt className="text-xs text-dim">Seller</dt><dd>{v.seller.displayName} <span className="ml-2"><SellerBadges seller={v.seller} size="sm" /></span></dd></div>
          <div><dt className="text-xs text-dim">Submitted</dt><dd>{formatDate(v.createdAt)}</dd></div>
          {v.inspectionNote && <div><dt className="text-xs text-dim">Inspection evidence</dt><dd>{v.inspectionNote}</dd></div>}
          {v.historyCheckNote && <div><dt className="text-xs text-dim">History-check evidence</dt><dd>{v.historyCheckNote}</dd></div>}
          {v.rejectionReason && <div><dt className="text-xs text-dim">Reviewer note</dt><dd>{v.rejectionReason}</dd></div>}
          <div><dt className="text-xs text-dim">Description</dt><dd className="whitespace-pre-line text-muted">{v.description ?? "—"}</dd></div>
        </dl>
      </div>
      {reports && reports.length > 0 && (
        <section className="mt-12">
          <h2 className="eyebrow mb-4">Reports ({reports.length})</h2>
          <ul className="divide-y divide-line border border-line text-sm">
            {reports.map((r) => <li key={r.id} className="flex justify-between gap-4 px-4 py-3"><span>{r.reason.replace(/_/g, " ")}{r.details && <span className="block text-xs text-muted">{r.details}</span>}</span><StatusBadge status={r.status} /></li>)}
          </ul>
        </section>
      )}
      <section className="mt-12">
        <h2 className="eyebrow mb-4">History</h2>
        <ol className="divide-y divide-line border border-line text-sm">
          {(history ?? []).map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-3 px-4 py-3">
              <span>{h.action.replace(/_/g, " ")}{h.from_status && ` · ${h.from_status} → ${h.to_status}`}{!h.from_status && h.to_status && ` · ${h.to_status}`}{h.note && <span className="block text-xs text-muted">{h.note}</span>}</span>
              <span className="font-mono text-[0.62rem] text-dim">{formatDate(h.created_at, "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
