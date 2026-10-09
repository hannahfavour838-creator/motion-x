import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { countryName } from "@/config/markets";
import { LABELS } from "@/config/vehicles";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { Price } from "@/components/vehicles/price";
import { SellerBadges } from "@/components/vehicles/seller-badges";
import { CompareSync, RemoveFromCompare } from "@/components/vehicles/compare-sync";
import { getVehiclesByIds } from "@/lib/data/vehicles";
import { formatMileage, formatNumber, localeFor } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

export const metadata: Metadata = { title: "Compare vehicles", robots: { index: false, follow: true } };

const ROWS: [string, (v: Vehicle) => React.ReactNode][] = [
  ["Price", (v) => <Price amount={v.price} currency={v.currency} locale={localeFor(v.countryCode)} size="sm" />],
  ["Year", (v) => v.year],
  ["Condition", (v) => LABELS.condition[v.condition]],
  ["Mileage", (v) => formatMileage(v.mileage, v.mileageUnit)],
  ["Body style", (v) => LABELS.bodyStyle[v.bodyStyle]],
  ["Transmission", (v) => LABELS.transmission[v.transmission]],
  ["Fuel", (v) => LABELS.fuelType[v.fuelType]],
  ["Drivetrain", (v) => (v.drivetrain ? LABELS.drivetrain[v.drivetrain] : "—")],
  ["Engine", (v) => v.engine ?? "—"],
  ["Power", (v) => (v.powerHp ? `${formatNumber(v.powerHp)} hp` : "—")],
  ["Seats", (v) => v.seats ?? "—"],
  ["Location", (v) => `${v.city}, ${countryName(v.countryCode)}`],
  ["Seller", (v) => <span className="space-y-2"><span className="block">{LABELS.sellerType[v.seller.type]}</span><SellerBadges seller={v.seller} size="sm" /></span>],
];

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const ids = typeof sp.ids === "string" ? sp.ids.split(",").filter(Boolean).slice(0, 4) : [];
  const vehicles = await getVehiclesByIds(ids);
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <CompareSync urlIds={ids} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/cars", label: "Discover" }, { label: "Compare" }]} />
      <h1 className="mt-8 font-display text-[clamp(2.2rem,5vw,4rem)] font-light uppercase">Compare</h1>
      <p className="mt-3 text-sm text-muted">Compare up to four vehicles side by side. Your selection is kept in this browser; the link is shareable.</p>
      {vehicles.length === 0 ? (
        <div className="mt-12"><EmptyState title="No vehicles selected" action={<ButtonLink href="/cars">Discover cars</ButtonLink>}>Use the compare icon on any vehicle to add it here.</EmptyState></div>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">Vehicle comparison</caption>
            <thead>
              <tr>
                <th scope="col" className="w-40 align-bottom"><span className="sr-only">Attribute</span></th>
                {vehicles.map((v) => (
                  <th key={v.id} scope="col" className="px-3 pb-6 align-top font-normal">
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-ink">
                      {v.images[0] && <Image src={v.images[0].url} alt={v.images[0].alt} fill sizes="25vw" className="object-cover" />}
                    </div>
                    <Link href={`/cars/${v.slug}`} className="mt-3 block font-display text-base uppercase leading-tight text-white hover:text-electric">{v.year} {v.make} {v.model}</Link>
                    {v.isDemo && <span className="mt-1 block text-xs text-warning">Demonstration listing</span>}
                    <div className="mt-2"><RemoveFromCompare id={v.id} urlIds={ids} /></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, render]) => (
                <tr key={label} className="border-t border-line">
                  <th scope="row" className="py-3.5 pr-4 font-mono text-[0.64rem] font-normal uppercase tracking-[0.16em] text-muted">{label}</th>
                  {vehicles.map((v) => <td key={v.id} className="px-3 py-3.5 align-top text-silver">{render(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
