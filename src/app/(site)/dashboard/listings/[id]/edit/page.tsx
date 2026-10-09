import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { FormMessage } from "@/components/ui/form";
import { ListingActions } from "@/components/dashboard/listing-actions";
import { ListingForm } from "@/components/dashboard/listing-form";
import { PhotoManager } from "@/components/dashboard/photo-manager";
import { ListingStatusBadge } from "@/components/dashboard/status-badge";
import { LABELS, type ListingStatus } from "@/config/vehicles";
import { requireSeller } from "@/lib/auth";
import { getListingHistory, getMyListing } from "@/lib/data/account";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage({ params, searchParams }: PageProps<"/dashboard/listings/[id]/edit">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireSeller(`/dashboard/listings/${id}/edit`);
  const vehicle = await getMyListing(user.id, id);
  if (!vehicle) notFound();
  const history = await getListingHistory(vehicle.id);
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <>
      <PageHeader
        eyebrow={sp.created ? "Step 2 of 3 · Photographs" : "Edit listing"}
        title={title}
        description={<span className="flex flex-wrap items-center gap-3"><ListingStatusBadge status={vehicle.status} /> <Link href={`/cars/${vehicle.slug}`} className="underline underline-offset-4 hover:text-white">{vehicle.status === "active" ? "View live listing" : "Preview listing"}</Link></span>}
        actions={<ListingActions id={vehicle.id} status={vehicle.status} />}
      />

      {sp.created && <div className="mb-8"><FormMessage tone="success">Draft saved. Upload your photographs below, then submit for review.</FormMessage></div>}
      {vehicle.status === "rejected" && (
        <div className="mb-8"><FormMessage>Changes requested by our review team{vehicle.rejectionReason ? `: ${vehicle.rejectionReason}` : "."} Update the listing and resubmit.</FormMessage></div>
      )}
      {vehicle.status === "suspended" && (
        <div className="mb-8"><FormMessage>This listing has been suspended{vehicle.rejectionReason ? `: ${vehicle.rejectionReason}` : "."} Contact support to resolve it.</FormMessage></div>
      )}
      {vehicle.status === "active" && (
        <div className="mb-8"><FormMessage tone="info">Price and specification updates go live immediately. Changing the make, model, year, body style, condition or description sends the listing back for review.</FormMessage></div>
      )}

      <PhotoManager vehicleId={vehicle.id} images={vehicle.images} title={title} />

      <div className="mt-16">
        <h2 className="mb-6 font-display text-xl uppercase">Details</h2>
        <ListingForm vehicle={vehicle} />
      </div>

      {history.length > 0 && (
        <section aria-labelledby="history-title" className="mt-16">
          <h2 id="history-title" className="eyebrow mb-4">Listing history</h2>
          <ol className="divide-y divide-line border border-line text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="text-silver">
                  {h.action === "created" ? "Created" : h.action === "admin_status_change" ? "Reviewed by MOTION X" : "Status changed"}
                  {h.to_status && <> → <strong className="font-normal text-white">{LABELS.status[h.to_status as ListingStatus] ?? h.to_status}</strong></>}
                  {h.note && <span className="block text-xs text-muted">{h.note}</span>}
                </span>
                <span className="font-mono text-[0.62rem] text-dim">{formatDate(h.created_at, "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
