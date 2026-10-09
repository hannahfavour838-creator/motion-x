import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/misc";
import { ShowroomViewer } from "@/components/three/showroom-viewer";
import { getShowroomAsset } from "@/lib/data/assets";
import { getVehicleBySlug } from "@/lib/data/vehicles";

export async function generateMetadata({ params }: PageProps<"/showroom/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getShowroomAsset(slug);
  if (!a) return { title: "Not found" };
  return {
    title: `${a.name} — 3D Showroom`,
    description: a.description ?? `Explore the ${a.name} in the MOTION X interactive 3D showroom.`,
    alternates: { canonical: `/showroom/${a.slug}` },
    openGraph: a.posterUrl ? { images: [{ url: a.posterUrl }] } : undefined,
  };
}

export default async function ShowroomAssetPage({ params, searchParams }: PageProps<"/showroom/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const asset = await getShowroomAsset(slug);
  if (!asset) notFound();
  const vehicle = typeof sp.vehicle === "string" ? await getVehicleBySlug(sp.vehicle) : null;
  const linked = vehicle && vehicle.assetId === asset.id ? vehicle : null;
  return (
    <div className="pb-24 pt-24 md:pt-28">
      <div className="container-x">
        <Breadcrumbs items={[{ href: "/showroom", label: "3D Showroom" }, ...(linked ? [{ href: `/cars/${linked.slug}`, label: `${linked.make} ${linked.model}` }] : []), { label: asset.name }]} />
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="font-display text-[clamp(2rem,4.6vw,4rem)] font-light uppercase leading-none">{asset.name}</h1>
          {linked ? (
            <Link href={`/cars/${linked.slug}`} className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-silver hover:text-white">Back to listing →</Link>
          ) : (
            <p className="text-sm text-muted">Showcase model · not for sale</p>
          )}
        </div>
      </div>
      <div className="container-x mt-8">
        <ShowroomViewer asset={asset} />
        <div className="mt-10 grid gap-8 border-t border-line pt-8 text-sm md:grid-cols-2">
          {asset.description && <p className="leading-relaxed text-muted">{asset.description}</p>}
          <p className="text-xs leading-relaxed text-dim">
            3D model: {asset.credit} Licensed under{" "}
            {asset.licenseUrl ? <a href={asset.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{asset.license}</a> : asset.license}.
            {" "}<Link href="/credits" className="underline underline-offset-2 hover:text-white">All credits</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
