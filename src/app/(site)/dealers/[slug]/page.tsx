import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { countryName } from "@/config/markets";
import { Badge, Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getDealerBySlug } from "@/lib/data/dealers";
import { getSellerPublicListings } from "@/lib/data/vehicles";
import { formatDate, initials } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/dealers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDealerBySlug(slug);
  if (!d) return { title: "Dealer not found", robots: { index: false } };
  return {
    title: `${d.businessName} — ${d.city}`,
    description: d.description?.slice(0, 160) ?? `${d.businessName}, a dealership in ${d.city}, ${countryName(d.countryCode)}, on MOTION X.`,
    alternates: { canonical: `/dealers/${d.slug}` },
    robots: d.isDemo ? { index: false } : undefined,
  };
}

export default async function DealerPage({ params }: PageProps<"/dealers/[slug]">) {
  const { slug } = await params;
  const d = await getDealerBySlug(slug);
  if (!d) notFound();
  const listings = await getSellerPublicListings(d.id);
  const jsonLd = !d.isDemo ? {
    "@context": "https://schema.org", "@type": "AutoDealer", name: d.businessName,
    address: { "@type": "PostalAddress", addressLocality: d.city, addressRegion: d.region ?? undefined, addressCountry: d.countryCode, streetAddress: d.addressLine ?? undefined },
    ...(d.website ? { url: d.website } : {}), ...(d.publicPhone ? { telephone: d.publicPhone } : {}), ...(d.logoUrl ? { logo: d.logoUrl } : {}),
  } : null;
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Breadcrumbs items={[{ href: "/dealers/directory", label: "Dealers" }, { label: d.businessName }]} />
      {d.isDemo && <p className="mt-6 border border-warning/25 bg-warning/[0.04] px-4 py-3 text-sm text-warning/90">Demonstration storefront — not a real business.</p>}
      <header className="mt-10 grid grid-cols-1 gap-10 border-b border-line pb-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex items-start gap-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-line bg-ink font-display text-xl">
            {d.logoUrl ? <Image src={d.logoUrl} alt={`${d.businessName} logo`} fill sizes="80px" className="object-contain p-2" /> : initials(d.businessName)}
          </div>
          <div className="min-w-0">
            <p className="eyebrow">{d.city}{d.region ? `, ${d.region}` : ""} · {countryName(d.countryCode)}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.5rem)] font-light uppercase leading-none [overflow-wrap:anywhere]">{d.businessName}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.isDemo ? <Badge tone="warning">Demonstration</Badge> : d.businessVerified ? <Badge tone="electric">Business verified</Badge> : <Badge tone="outline">Registered dealer</Badge>}
              <Badge tone="outline">On MOTION X since {formatDate(d.createdAt, "en-GB", { month: "short", year: "numeric" })}</Badge>
            </div>
            {d.description && <p className="mt-6 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-silver">{d.description}</p>}
          </div>
        </div>
        {!d.isDemo && (d.website || d.publicEmail || d.publicPhone || d.whatsapp || d.addressLine) && (
          <dl className="space-y-3 border border-line bg-ink p-5 text-sm">
            {d.addressLine && <div><dt className="text-xs text-dim">Showroom</dt><dd className="text-silver">{d.addressLine}, {d.city}</dd></div>}
            {d.website && <div><dt className="text-xs text-dim">Website</dt><dd><a href={d.website} rel="noopener noreferrer nofollow" target="_blank" className="break-all text-white underline underline-offset-2">{d.website.replace(/^https?:\/\//, "")}</a></dd></div>}
            {d.publicEmail && <div><dt className="text-xs text-dim">Email</dt><dd><a href={`mailto:${d.publicEmail}`} className="text-white">{d.publicEmail}</a></dd></div>}
            {d.publicPhone && <div><dt className="text-xs text-dim">Phone</dt><dd><a href={`tel:${d.publicPhone}`} className="text-white">{d.publicPhone}</a></dd></div>}
            {d.whatsapp && <div><dt className="text-xs text-dim">WhatsApp</dt><dd><a href={`https://wa.me/${d.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-white">{d.whatsapp}</a></dd></div>}
          </dl>
        )}
      </header>
      <section aria-labelledby="inv" className="mt-12">
        <h2 id="inv" className="eyebrow mb-6">Inventory · {listings.length}</h2>
        {listings.length ? (
          <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((v) => <li key={v.id} className="bg-obsidian"><VehicleCard vehicle={v} /></li>)}
          </ul>
        ) : <EmptyState title="No vehicles listed right now" />}
      </section>
    </div>
  );
}
