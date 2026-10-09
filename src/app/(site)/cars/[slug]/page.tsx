import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countryName } from "@/config/markets";
import { LABELS } from "@/config/vehicles";
import { siteConfig } from "@/config/site";
import { getAssetById } from "@/lib/data/assets";
import { getSimilarVehicles, getVehicleBySlug } from "@/lib/data/vehicles";
import { formatDate, formatMileage, formatNumber, formatPrice, localeFor } from "@/lib/format";
import { Badge, Breadcrumbs } from "@/components/ui/misc";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { EnquiryForm, InspectionButton, ReportButton } from "@/components/vehicles/contact-forms";
import { Gallery } from "@/components/vehicles/gallery";
import { Price } from "@/components/vehicles/price";
import { SellerBadges, VehicleEvidenceBadges } from "@/components/vehicles/seller-badges";
import { CompareButton, SaveButton } from "@/components/vehicles/vehicle-actions";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ViewTracker } from "@/components/vehicles/view-tracker";

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Vehicle not found", robots: { index: false } };
  const title = `${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}`;
  const price = formatPrice(v.price, v.currency, localeFor(v.countryCode));
  const description = `${title} for sale in ${v.city}, ${countryName(v.countryCode)} — ${price}, ${formatMileage(v.mileage, v.mileageUnit)}, ${LABELS.transmission[v.transmission].toLowerCase()}, ${LABELS.fuelType[v.fuelType].toLowerCase()}. Listed by a ${LABELS.sellerType[v.seller.type].toLowerCase()} on MOTION X.`;
  const isPublic = v.status === "active" || v.status === "sold";
  return {
    title: v.isDemo ? `${title} (demonstration)` : title,
    description,
    alternates: { canonical: `/cars/${v.slug}` },
    robots: v.isDemo || !isPublic ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} · ${price}`,
      description,
      url: `/cars/${v.slug}`,
      images: v.images[0] ? [{ url: v.images[0].url, alt: v.images[0].alt || title }] : undefined,
    },
  };
}

function Spec({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
      <dt className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className="text-right text-sm text-white">{value}</dd>
    </div>
  );
}

export default async function VehiclePage({ params }: PageProps<"/cars/[slug]">) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();
  const [similar, asset] = await Promise.all([getSimilarVehicles(v, 3), getAssetById(v.assetId)]);
  const locale = localeFor(v.countryCode);
  const title = `${v.year} ${v.make} ${v.model}`;
  const isPublic = v.status === "active" || v.status === "sold";
  const available = v.status === "active";
  const whatsapp = v.seller.type === "dealer" && v.seller.whatsapp && !v.isDemo ? v.seller.whatsapp : null;
  const sellerHref = v.seller.isDemo ? null : v.seller.slug ? `/dealers/${v.seller.slug}` : `/sellers/${v.seller.id}`;

  // Structured data only for genuine, public listings, using data we actually hold.
  const jsonLd = !v.isDemo && isPublic
    ? {
        "@context": "https://schema.org",
        "@type": "Car",
        name: `${title}${v.variant ? ` ${v.variant}` : ""}`,
        brand: { "@type": "Brand", name: v.make },
        model: v.model,
        vehicleModelDate: String(v.year),
        bodyType: LABELS.bodyStyle[v.bodyStyle],
        fuelType: LABELS.fuelType[v.fuelType],
        vehicleTransmission: LABELS.transmission[v.transmission],
        itemCondition: v.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: v.mileageUnit === "mi" ? "SMI" : "KMT" },
        ...(v.exteriorColour ? { color: v.exteriorColour } : {}),
        image: v.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteConfig.url}${i.url}`)),
        url: `${siteConfig.url}/cars/${v.slug}`,
        offers: {
          "@type": "Offer",
          price: v.price,
          priceCurrency: v.currency,
          availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          areaServed: countryName(v.countryCode),
        },
      }
    : null;

  return (
    <div className="pb-24 pt-24 md:pt-28">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {isPublic && <ViewTracker vehicleId={v.id} />}

      <div className="container-x">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/cars", label: "Discover" }, { href: `/cars?make=${encodeURIComponent(v.make)}`, label: v.make }, { label: v.model }]} />

        {!isPublic && (
          <div className="mt-6 border border-warning/30 bg-warning/[0.05] px-4 py-3 text-sm text-warning" role="status">
            Preview — this listing is <strong>{LABELS.status[v.status].toLowerCase()}</strong> and is not visible to the public.
            {v.rejectionReason && <span className="block mt-1 text-silver">Reviewer note: {v.rejectionReason}</span>}
          </div>
        )}
        {v.isDemo && (
          <div className="mt-6 border border-warning/25 bg-warning/[0.04] px-4 py-3 text-sm text-warning/90" role="note">
            Demonstration listing — created to preview MOTION X. It is not a real vehicle for sale and the images are illustrative studio renders.
          </div>
        )}
      </div>

      <div className="container-x mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)] lg:gap-14">
        <div className="min-w-0">
          <Gallery images={v.images} title={title} />
          {asset && (
            <Link href={`/showroom/${asset.slug}?vehicle=${v.slug}`} className="group mt-px flex items-center justify-between bg-ink px-5 py-4 transition-colors hover:bg-charcoal">
              <span className="flex items-center gap-3">
                <Badge tone="electric">3D</Badge>
                <span className="text-sm text-white">Explore this model in the interactive 3D showroom</span>
              </span>
              <ArrowRight />
            </Link>
          )}
        </div>

        <aside className="lg:row-span-2">
          <div className="lg:sticky lg:top-28">
            <div className="flex flex-wrap gap-2">
              <Badge tone="outline">{LABELS.condition[v.condition]}</Badge>
              {v.status === "sold" && <Badge tone="danger">Sold</Badge>}
              {available && !v.isDemo && <Badge tone="success">Available</Badge>}
            </div>
            <h1 className="mt-5 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-normal uppercase leading-[0.98]">
              <span className="block font-mono text-sm font-normal tracking-[0.2em] text-muted">{v.year}</span>
              {v.make} {v.model}
            </h1>
            {v.variant && <p className="mt-2 text-lg text-silver">{v.variant}</p>}
            <Price amount={v.price} currency={v.currency} locale={locale} size="lg" className="mt-6" />
            <p className="mt-2 text-xs text-dim">Asking price set by the seller in {v.currency}.</p>

            <dl className="mt-8 grid grid-cols-2 gap-px bg-line text-sm">
              {[
                ["Mileage", formatMileage(v.mileage, v.mileageUnit, locale)],
                ["Location", `${v.city}, ${countryName(v.countryCode)}`],
                ["Gearbox", LABELS.transmission[v.transmission]],
                ["Fuel", LABELS.fuelType[v.fuelType]],
              ].map(([k, val]) => (
                <div key={k} className="bg-obsidian py-3 pr-3">
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-dim">{k}</dt>
                  <dd className="mt-1 text-white">{val}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              {available && (
                <a href="#contact" className="inline-flex h-14 items-center justify-center bg-white font-mono text-[0.72rem] uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-silver">
                  Contact seller
                </a>
              )}
              {whatsapp && available && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I'm interested in the ${title} listed on MOTION X: ${siteConfig.url}/cars/${v.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 border border-line-strong font-mono text-[0.68rem] uppercase tracking-[0.18em] text-white hover:border-white"
                >
                  WhatsApp enquiry
                </a>
              )}
              <div className="grid grid-cols-2 gap-3">
                <SaveButton vehicleId={v.id} variant="full" />
                <CompareButton vehicleId={v.id} variant="full" />
              </div>
              {v.inspectionAvailable && available && <InspectionButton vehicleId={v.id} />}
            </div>

            <div className="mt-8 border border-line bg-ink p-5">
              <p className="eyebrow">Seller</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {sellerHref ? (
                    <Link href={sellerHref} className="font-display text-base uppercase tracking-wide text-white hover:text-electric">{v.seller.displayName}</Link>
                  ) : (
                    <p className="font-display text-base uppercase tracking-wide text-white">{v.seller.displayName}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {LABELS.sellerType[v.seller.type]}
                    {v.seller.city ? ` · ${v.seller.city}` : ""}
                    {!v.seller.isDemo && ` · Member since ${formatDate(v.seller.memberSince, "en-GB", { month: "short", year: "numeric" })}`}
                  </p>
                </div>
              </div>
              <div className="mt-4"><SellerBadges seller={v.seller} /></div>
              <p className="mt-4 text-xs leading-relaxed text-dim">
                Seller verification confirms identity or business details only. It is not a mechanical inspection or vehicle history check.{" "}
                <Link href="/trust" className="underline underline-offset-2 hover:text-white">Learn more</Link>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-dim">
                Listed {formatDate(v.publishedAt ?? v.createdAt)} · Ref {v.id.slice(0, 8)}
              </p>
              {isPublic && <ReportButton vehicleId={v.id} />}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-16">
          <VehicleEvidenceBadges vehicle={v} />
          <section aria-labelledby="specs-title">
            <h2 id="specs-title" className="eyebrow mb-4">Specification</h2>
            <dl className="grid gap-x-10 md:grid-cols-2">
              <Spec label="Make" value={v.make} />
              <Spec label="Model" value={v.model} />
              <Spec label="Variant" value={v.variant} />
              <Spec label="Year" value={v.year} />
              <Spec label="Condition" value={LABELS.condition[v.condition]} />
              <Spec label="Mileage" value={formatMileage(v.mileage, v.mileageUnit, locale)} />
              <Spec label="Body style" value={LABELS.bodyStyle[v.bodyStyle]} />
              <Spec label="Category" value={LABELS.segment[v.segment]} />
              <Spec label="Transmission" value={LABELS.transmission[v.transmission]} />
              <Spec label="Fuel type" value={LABELS.fuelType[v.fuelType]} />
              <Spec label="Drivetrain" value={v.drivetrain ? LABELS.drivetrain[v.drivetrain] : null} />
              <Spec label="Engine" value={v.engine} />
              <Spec label="Power" value={v.powerHp ? `${formatNumber(v.powerHp)} hp` : null} />
              <Spec label="Doors" value={v.doors} />
              <Spec label="Seats" value={v.seats} />
              <Spec label="Exterior colour" value={v.exteriorColour} />
              <Spec label="Interior" value={v.interiorColour} />
              <Spec label="Location" value={[v.city, v.region, countryName(v.countryCode)].filter(Boolean).join(", ")} />
            </dl>
          </section>

          {v.description && (
            <section aria-labelledby="desc-title">
              <h2 id="desc-title" className="eyebrow mb-4">Seller&apos;s description</h2>
              <div className="max-w-3xl space-y-4 whitespace-pre-line text-[0.98rem] leading-relaxed text-silver">{v.description}</div>
            </section>
          )}

          <section aria-labelledby="intl-title" className="border border-line p-6">
            <h2 id="intl-title" className="eyebrow mb-3">Buying across borders</h2>
            <p className="text-sm leading-relaxed text-muted">
              Not every vehicle can be exported or shipped. Import duties, taxes, registration, transport and vehicle compliance
              requirements vary by destination — confirm them with the seller and the relevant authorities before committing.
              MOTION X does not handle payments; never send money for a vehicle you have not verified.
            </p>
          </section>

          {available && (
            <section id="contact" aria-labelledby="contact-title" className="scroll-mt-28 border border-line bg-ink p-6 md:p-10">
              <p className="eyebrow">Contact seller</p>
              <h2 id="contact-title" className="mt-3 font-display text-2xl uppercase">Ask about this {v.make}</h2>
              <div className="mt-8 max-w-2xl">
                <EnquiryForm vehicleId={v.id} vehicleTitle={title} whatsappEnabled={Boolean(whatsapp)} />
              </div>
            </section>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar-title" className="container-x mt-24 border-t border-line pt-16">
          <div className="flex items-end justify-between gap-6">
            <h2 id="similar-title" className="font-display text-3xl uppercase">Similar vehicles</h2>
            <ButtonLink href={`/cars?segment=${v.segment}`} variant="ghost" iconRight={<ArrowRight />}>More {LABELS.segment[v.segment]}</ButtonLink>
          </div>
          <ul className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <li key={s.id} className="bg-obsidian"><VehicleCard vehicle={s} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
