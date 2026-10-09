import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs, Eyebrow } from "@/components/ui/misc";
import { listShowroomAssets } from "@/lib/data/assets";
import { searchVehicles } from "@/lib/data/vehicles";
import { VehicleCard } from "@/components/vehicles/vehicle-card";

export const metadata: Metadata = {
  title: "3D Showroom",
  description: "Explore vehicles in an interactive 3D studio — orbit, zoom, change viewing angles and paint finishes.",
  alternates: { canonical: "/showroom" },
};
export const revalidate = 300;

export default async function ShowroomIndex() {
  const [assets, with3d] = await Promise.all([listShowroomAssets(), searchVehicles({ has3d: true }).catch(() => null)]);
  return (
    <div className="pb-24 pt-28 md:pt-36">
      <div className="container-x">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "3D Showroom" }]} />
        <Eyebrow className="mt-8">Interactive studio</Eyebrow>
        <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,5.5rem)] font-light uppercase leading-[0.95]">The 3D showroom</h1>
        <p className="mt-5 max-w-2xl text-muted">
          Vehicles with a supported, licensed 3D model can be explored in the studio. Listings without a 3D model show their
          photo gallery instead — we never present a photograph as an interactive model.
        </p>
      </div>
      <ul className="container-x mt-14 grid gap-px bg-line">
        {assets.map((a) => (
          <li key={a.id}>
            <Link href={`/showroom/${a.slug}`} className="group relative isolate grid overflow-hidden bg-ink md:grid-cols-[1.5fr_1fr]">
              <div className="relative aspect-[16/9]">
                {a.posterUrl && <Image src={a.posterUrl} alt={`Studio render of the ${a.name}`} fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover transition-transform duration-[1.4s] group-hover:scale-[1.03]" />}
              </div>
              <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
                <div className="flex gap-2"><Badge tone="electric">Interactive 3D</Badge><Badge tone="outline">Showcase model</Badge></div>
                <h2 className="font-display text-3xl uppercase leading-none">{a.name}</h2>
                {a.description && <p className="text-sm leading-relaxed text-muted">{a.description}</p>}
                <span className="inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-white">Enter the showroom <ArrowRight /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <section className="container-x mt-20">
        <h2 className="eyebrow mb-6">Listings with a 3D model</h2>
        {with3d && with3d.vehicles.length > 0 ? (
          <ul className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">{with3d.vehicles.map((v) => <li key={v.id} className="bg-obsidian"><VehicleCard vehicle={v} /></li>)}</ul>
        ) : (
          <div className="flex flex-col gap-5 border border-dashed border-line p-8 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm text-muted">No marketplace listings have a licensed 3D model attached yet. Dealers can contact us about adding 3D models to their inventory.</p>
            <ButtonLink href="/contact?topic=dealer" variant="secondary">Contact us</ButtonLink>
          </div>
        )}
      </section>
    </div>
  );
}
