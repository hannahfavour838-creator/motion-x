import type { Metadata } from "next";
import Link from "next/link";
import { countryName } from "@/config/markets";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { listDealers } from "@/lib/data/dealers";

export const metadata: Metadata = { title: "Dealer directory", description: "Dealerships selling on MOTION X.", alternates: { canonical: "/dealers/directory" } };
export const revalidate = 300;

export default async function DirectoryPage() {
  const dealers = await listDealers({ includeDemo: true, limit: 96 });
  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ href: "/dealers", label: "For dealers" }, { label: "Directory" }]} />
      <h1 className="mt-8 font-display text-[clamp(2.2rem,5vw,4rem)] font-light uppercase">Dealer directory</h1>
      {dealers.length === 0 ? (
        <div className="mt-12"><EmptyState title="No dealerships yet" action={<ButtonLink href="/sign-up?type=dealer">Register your dealership</ButtonLink>}>Dealerships appear here once they create a storefront.</EmptyState></div>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {dealers.map((d) => (
            <li key={d.id} className="bg-obsidian">
              <Link href={`/dealers/${d.slug}`} className="flex h-full flex-col justify-between gap-8 p-7 hover:bg-ink">
                <div>
                  <p className="eyebrow">{d.city}, {countryName(d.countryCode)}</p>
                  <h2 className="mt-3 font-display text-lg uppercase">{d.businessName}</h2>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span>{d.listingCount} live listing{d.listingCount === 1 ? "" : "s"}</span>
                  {d.isDemo ? <Badge tone="warning">Demonstration</Badge> : d.businessVerified ? <Badge tone="electric">Business verified</Badge> : <Badge tone="outline">Registered dealer</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
