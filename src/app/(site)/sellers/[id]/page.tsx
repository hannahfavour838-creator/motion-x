import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { countryName } from "@/config/markets";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { SellerBadges } from "@/components/vehicles/seller-badges";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getPublicSeller } from "@/lib/data/dealers";
import { getSellerPublicListings } from "@/lib/data/vehicles";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Seller", robots: { index: false, follow: true } };

export default async function SellerPage({ params }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) notFound();
  if (seller.type === "dealer" && seller.slug) redirect(`/dealers/${seller.slug}`);
  const listings = await getSellerPublicListings(seller.id);
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ href: "/cars", label: "Discover" }, { label: "Private seller" }]} />
      <h1 className="mt-8 font-display text-[clamp(2rem,4.4vw,3.5rem)] font-light uppercase">{seller.displayName}</h1>
      <p className="mt-3 text-sm text-muted">Private seller{seller.city ? ` · ${seller.city}` : ""}{seller.countryCode ? `, ${countryName(seller.countryCode)}` : ""}{!seller.isDemo && ` · Member since ${formatDate(seller.memberSince, "en-GB", { month: "short", year: "numeric" })}`}</p>
      <div className="mt-4"><SellerBadges seller={seller} /></div>
      <section className="mt-12">
        <h2 className="eyebrow mb-6">Listings · {listings.length}</h2>
        {listings.length ? (
          <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">{listings.map((v) => <li key={v.id} className="bg-obsidian"><VehicleCard vehicle={v} /></li>)}</ul>
        ) : <EmptyState title="No live listings" />}
      </section>
    </div>
  );
}
