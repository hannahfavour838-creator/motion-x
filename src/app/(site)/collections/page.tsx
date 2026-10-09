import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS, collectionHref } from "@/config/vehicles";
import { ArrowRight } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/misc";
import { withFallback } from "@/lib/data/fallback";
import { searchVehicles } from "@/lib/data/vehicles";
import { parseFilters } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Collections",
  description: "Supercars, luxury, performance, SUVs, electric, everyday and classic vehicles on MOTION X.",
  alternates: { canonical: "/collections" },
};
export const revalidate = 300;

export default async function CollectionsPage() {
  const counts = await Promise.all(
    COLLECTIONS.map((c) => withFallback(searchVehicles(parseFilters(new URLSearchParams(c.filters))).then((r): number | null => r.total), null, `collection count (${c.slug})`)),
  );
  return (
    <div className="pb-24 pt-28 md:pt-36">
      <div className="container-x">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Collections" }]} />
        <h1 className="mt-8 font-display text-[clamp(2.4rem,6vw,5.5rem)] font-light uppercase leading-[0.95]">Collections</h1>
        <p className="mt-5 max-w-xl text-muted">Curated ways into the marketplace. Every collection opens live search results you can refine further.</p>
      </div>
      <ul className="container-x mt-14 space-y-px">
        {COLLECTIONS.map((c, i) => (
          <li key={c.slug}>
            <Link href={collectionHref(c)} className="group relative isolate grid min-h-[22rem] overflow-hidden bg-ink md:grid-cols-2">
              <div className={`relative min-h-56 ${i % 2 ? "md:order-2" : ""}`}>
                <Image src={c.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" {...(i === 0 ? { loading: "eager" as const, fetchPriority: "high" as const } : {})} className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-cinematic)] group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-14">
                <span className="font-mono text-xs text-electric">{c.kicker}</span>
                <h2 className="mt-4 font-display text-[clamp(1.8rem,3.4vw,3rem)] uppercase leading-none">{c.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{c.description}</p>
                <p className="mt-8 flex items-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-white">
                  {counts[i] !== null ? `${counts[i]} vehicle${counts[i] === 1 ? "" : "s"}` : "Explore"} <ArrowRight />
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
