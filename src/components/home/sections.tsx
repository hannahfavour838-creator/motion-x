import Image from "next/image";
import Link from "next/link";
import { COLLECTIONS, collectionHref } from "@/config/vehicles";
import { countryName } from "@/config/markets";
import { ArrowRight, ButtonLink } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";
import { QuickSearch } from "@/components/vehicles/quick-search";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import type { DealerProfile, Vehicle } from "@/lib/types";
import { cn } from "@/lib/format";

// ── B · Global discovery ──────────────────────────────────────────────────
export function DiscoverySection({ makes, marketCounts }: { makes: string[]; marketCounts: Record<string, number> }) {
  const markets = Object.entries(marketCounts).sort((a, b) => b[1] - a[1]);
  return (
    <section id="discover" aria-labelledby="discover-title" className="relative scroll-mt-20 py-24 md:py-36">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <Reveal>
            <SectionHeading
              index="01"
              eyebrow="Global discovery"
              title={<span id="discover-title">Extraordinary cars.<br />Endless possibilities.</span>}
            >
              MOTION X brings together vehicles from private owners and professional dealerships across international
              markets — searchable in one place, with every price shown in the currency the seller asked for.
            </SectionHeading>
          </Reveal>
          {markets.length > 0 && (
            <Reveal delay={120}>
              <p className="eyebrow mb-4">Listings by market</p>
              <ul className="flex flex-wrap gap-2">
                {markets.map(([code, n]) => (
                  <li key={code}>
                    <Link href={`/cars?country=${code}`} className="inline-flex items-center gap-2 border border-line px-3 py-2 text-sm text-silver transition-colors hover:border-white hover:text-white">
                      {countryName(code)} <span className="font-mono text-[0.65rem] text-dim">{n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
        <Reveal delay={150} className="mt-14">
          <QuickSearch makes={makes} />
        </Reveal>
      </div>
    </section>
  );
}

// ── C · Curated collections ───────────────────────────────────────────────
export function CollectionsSection() {
  const [first, ...rest] = COLLECTIONS;
  return (
    <section aria-labelledby="collections-title" className="border-t border-line py-24 md:py-36">
      <div className="container-x">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading index="02" eyebrow="Curated collections" title={<span id="collections-title">Find your<br />kind of drive.</span>} />
          </Reveal>
          <Reveal delay={100}>
            <ButtonLink href="/collections" variant="secondary" iconRight={<ArrowRight />}>All collections</ButtonLink>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-px bg-line md:grid-cols-4 md:grid-rows-[repeat(3,minmax(15rem,auto))]">
          <CollectionTile c={first} className="md:col-span-2 md:row-span-2" large priority />
          {rest.map((c, i) => (
            <CollectionTile key={c.slug} c={c} className={cn(i === 0 && "md:col-span-2", i === 5 && "md:col-span-2")} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionTile({ c, className, large = false, priority = false }: { c: (typeof COLLECTIONS)[number]; className?: string; large?: boolean; priority?: boolean }) {
  return (
    <Link href={collectionHref(c)} className={cn("group relative isolate flex min-h-64 flex-col justify-end overflow-hidden bg-ink p-6 md:p-8", className)}>
      <Image
        src={c.image}
        alt=""
        fill
        priority={priority}
        sizes={large ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
        className="-z-10 object-cover opacity-80 transition-[transform,opacity] duration-[1.4s] ease-[var(--ease-cinematic)] group-hover:scale-105 group-hover:opacity-100"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
      <span className="font-mono text-[0.65rem] tracking-[0.2em] text-electric">{c.kicker}</span>
      <h3 className={cn("mt-3 font-display uppercase leading-none text-white", large ? "text-4xl md:text-5xl" : "text-2xl")}>{c.title}</h3>
      <p className={cn("mt-3 max-w-sm text-sm leading-relaxed text-silver/80", !large && "line-clamp-2")}>{c.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white">
        Explore <ArrowRight />
      </span>
    </Link>
  );
}

// ── D · Featured vehicles ─────────────────────────────────────────────────
export function FeaturedSection({ vehicles }: { vehicles: Vehicle[] }) {
  const demo = vehicles.some((v) => v.isDemo);
  return (
    <section aria-labelledby="featured-title" className="border-t border-line py-24 md:py-36">
      <div className="container-x">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading index="03" eyebrow={demo ? "Demonstration inventory" : "Featured vehicles"} title={<span id="featured-title">Now in<br />the showroom.</span>}>
              {demo && (
                <span className="text-sm">
                  These are fictional demonstration listings, illustrated with representative photographs of each
                  model, so you can explore the marketplace. They are not vehicles for sale.
                </span>
              )}
            </SectionHeading>
          </Reveal>
          <Reveal delay={100}>
            <ButtonLink href="/cars" variant="secondary" iconRight={<ArrowRight />}>View all vehicles</ButtonLink>
          </Reveal>
        </div>
        {vehicles.length ? (
          <div className="mt-14 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((v, i) => (
              <Reveal key={v.id} delay={(i % 3) * 90} className="bg-obsidian">
                <VehicleCard vehicle={v} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-14 border border-dashed border-line p-10 text-center text-muted">
            The first listings are being reviewed. <Link href="/sell" className="text-white underline underline-offset-4">List your car</Link> to be among them.
          </p>
        )}
      </div>
    </section>
  );
}

// ── E · 3D showroom ───────────────────────────────────────────────────────
export function ShowroomSection() {
  return (
    <section aria-labelledby="showroom-title" className="relative isolate overflow-hidden border-t border-line">
      <div className="absolute inset-0 -z-10">
        <Image src="/renders/showroom-side.webp" alt="" fill sizes="100vw" className="object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/60 to-obsidian/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian to-transparent" />
      </div>
      <div className="container-x flex min-h-[80svh] items-center py-24 md:py-36">
        <Reveal className="max-w-2xl">
          <Eyebrow index="04">The 3D showroom</Eyebrow>
          <h2 id="showroom-title" className="mt-6 font-display text-[clamp(2.2rem,4.6vw,4rem)] uppercase leading-[0.95] text-white">
            Walk around it.<br />Before you travel.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-silver md:text-lg">
            Vehicles with a supported 3D model open in an interactive studio. Orbit, zoom, change viewing angles and, where
            the model supports it, compare paint finishes — with a mouse, a keyboard or touch.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            <li>— Orbit &amp; zoom</li>
            <li>— Preset viewing angles</li>
            <li>— Paint finishes</li>
            <li>— Fullscreen studio</li>
          </ul>
          <div className="mt-10">
            <ButtonLink href="/showroom/concept-car" size="lg" iconRight={<ArrowRight />}>Enter the showroom</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── F · Global dealers ────────────────────────────────────────────────────
export function DealersSection({ dealers }: { dealers: DealerProfile[] }) {
  return (
    <section aria-labelledby="dealers-title" className="border-t border-line py-24 md:py-36">
      <div className="container-x">
        {dealers.length > 0 ? (
          <>
            <Reveal>
              <SectionHeading index="05" eyebrow="Global dealers" title={<span id="dealers-title">Dealerships<br />on MOTION X.</span>} />
            </Reveal>
            <ul className="mt-14 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {dealers.slice(0, 6).map((d) => (
                <li key={d.id} className="bg-obsidian">
                  <Link href={`/dealers/${d.slug}`} className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-ink">
                    <div>
                      <p className="eyebrow">{d.city}, {countryName(d.countryCode)}</p>
                      <h3 className="mt-4 font-display text-xl uppercase text-white">{d.businessName}</h3>
                    </div>
                    <p className="flex items-center justify-between text-sm text-muted">
                      <span>{d.listingCount} live listing{d.listingCount === 1 ? "" : "s"}</span>
                      {d.businessVerified && <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#9db8ff]">Business verified</span>}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Reveal className="grid gap-12 border border-line bg-ink p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
            <div>
              <Eyebrow index="05">Global dealers</Eyebrow>
              <h2 id="dealers-title" className="mt-6 font-display text-[clamp(2rem,4.4vw,3.75rem)] uppercase leading-[0.95] text-white">
                Your dealership.<br />Our global stage.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
                MOTION X is opening to its first dealership partners. Create a storefront, publish inventory and receive
                enquiries from buyers in every market we serve. Verified dealerships will be showcased here.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3 md:items-end">
              <ButtonLink href="/sign-up?type=dealer" size="lg" iconRight={<ArrowRight />}>Register your dealership</ButtonLink>
              <ButtonLink href="/dealers" size="lg" variant="secondary">Explore dealer tools</ButtonLink>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ── G · For sellers ───────────────────────────────────────────────────────
const sellerFeatures = [
  ["Structured listings", "Make, model, specification, mileage, location and the price in your own currency."],
  ["Up to 24 photographs", "Upload with progress, reorder and remove — stored securely and served fast."],
  ["Enquiries in one place", "Buyers contact you through MOTION X. Reply, track status and keep your details private."],
  ["Performance", "Views, saves and enquiries for every listing, from real activity."],
];

export function SellersSection() {
  return (
    <section aria-labelledby="sellers-title" className="border-t border-line py-24 md:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-2">
        <Reveal>
          <SectionHeading index="06" eyebrow="For sellers" title={<span id="sellers-title">Your inventory.<br />A world of opportunity.</span>}>
            Bring your vehicles online, connect with interested buyers, and manage your listings through one sophisticated platform.
          </SectionHeading>
          <div className="mt-10 flex flex-col gap-3 xs:flex-row">
            <ButtonLink href="/sell/start" size="lg" iconRight={<ArrowRight />}>List your car</ButtonLink>
            <ButtonLink href="/dealers" size="lg" variant="secondary">Explore dealer tools</ButtonLink>
          </div>
        </Reveal>
        <ol className="grid gap-px self-end bg-line sm:grid-cols-2">
          {sellerFeatures.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 80} className="bg-obsidian p-7">
              <span className="font-mono text-[0.65rem] text-electric">0{i + 1}</span>
              <h3 className="mt-4 font-display text-base uppercase tracking-wide text-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── H · Trust & transparency ──────────────────────────────────────────────
const trustItems = [
  ["Listing review", "New listings are reviewed by the MOTION X team before they become public, and material edits are reviewed again."],
  ["Seller verification", "Sellers can apply for identity verification; dealerships for business verification. Badges appear only once approved."],
  ["Not a mechanical inspection", "Verification confirms who a seller is — not the condition of a vehicle. Inspection and history badges are separate and shown only with evidence on file."],
  ["Report anything", "Every listing has a report option. Reports are reviewed and suspicious listings can be suspended."],
];

export function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className="border-t border-line py-24 md:py-36">
      <div className="container-x">
        <Reveal>
          <SectionHeading index="07" eyebrow="Trust & transparency" title={<span id="trust-title">Clear about<br />what we check.</span>}>
            Trust is earned with precision. Here is exactly what MOTION X verifies — and what it does not.
          </SectionHeading>
        </Reveal>
        <dl className="mt-14 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map(([t, b], i) => (
            <Reveal key={t} delay={i * 80} className="bg-obsidian p-8">
              <dt className="font-display text-base uppercase tracking-wide text-white">{t}</dt>
              <dd className="mt-4 text-sm leading-relaxed text-muted">{b}</dd>
            </Reveal>
          ))}
        </dl>
        <Reveal className="mt-8">
          <Link href="/trust" className="inline-flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-silver hover:text-white">
            How verification works <ArrowRight />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ── I · Final call to action ──────────────────────────────────────────────
export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="relative isolate overflow-hidden border-t border-line py-28 md:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(35,74,156,0.35),transparent_70%)]" />
      <div className="container-x text-center">
        <Reveal>
          <Eyebrow className="justify-center">MOTION X</Eyebrow>
          <h2 id="final-title" className="mx-auto mt-8 max-w-5xl font-display text-[clamp(2.4rem,7vw,7rem)] font-light uppercase leading-[0.92]">
            <span className="text-metal">Your next drive<br />starts here.</span>
          </h2>
          <div className="mt-12 flex flex-col justify-center gap-3 xs:flex-row">
            <ButtonLink href="/cars" size="lg" iconRight={<ArrowRight />}>Discover your next car</ButtonLink>
            <ButtonLink href="/sign-up" size="lg" variant="secondary">Join MOTION X</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
