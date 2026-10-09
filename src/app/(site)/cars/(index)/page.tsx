import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { FiltersPanel, SortSelect } from "@/components/vehicles/filters-panel";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { TrackEvent } from "@/components/providers/track-event";
import { getMakeSuggestions, searchVehicles } from "@/lib/data/vehicles";
import { activeFilterChips, describeFilters, filtersHref, filtersToSearchParams, parseFilters } from "@/lib/search-params";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({ searchParams }: PageProps<"/cars">): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const title = describeFilters(filters);
  const chips = activeFilterChips(filters);
  const canonical = filtersHref({ ...filters, sort: undefined, page: undefined });
  return {
    title: filters.q ? `“${filters.q}” — ${title}` : title,
    description: `${title} for sale from private sellers and dealerships on MOTION X. Search by price, year, mileage, body style and location.`,
    alternates: { canonical },
    // Index the main marketplace and single-facet pages; deep filter combinations are not indexed.
    robots: chips.length > 2 || filters.q ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} · MOTION X`, url: canonical },
  };
}

export default async function CarsPage({ searchParams }: PageProps<"/cars">) {
  const filters = parseFilters(await searchParams);
  const [result, makes] = await Promise.all([searchVehicles(filters), getMakeSuggestions()]);
  const chips = activeFilterChips(filters);
  const heading = describeFilters(filters);
  const hasDemo = result.vehicles.some((v) => v.isDemo);
  const hrefFor = (p: number) => {
    const sp = filtersToSearchParams({ ...filters, page: p });
    return `/cars${sp.toString() ? `?${sp}` : ""}`;
  };
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <div className="container-x pb-24 pt-28 md:pt-36">
      <TrackEvent event="search" props={{ results: result.total, filters: chips.length }} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Discover" }]} />
      <div className="mt-8 flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-light uppercase leading-[0.95]">{heading}</h1>
          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {result.total === 0 ? "No vehicles match these filters" : `Showing ${from}–${to} of ${formatNumber(result.total)} vehicle${result.total === 1 ? "" : "s"}`}
          </p>
        </div>
        <SortSelect value={filters.sort ?? "relevance"} />
      </div>

      {hasDemo && (
        <p className="mt-6 border border-warning/25 bg-warning/[0.04] px-4 py-3 text-sm text-warning/90">
          Demonstration inventory — these listings and sellers are fictional and exist so you can explore MOTION X. Photographs show representative examples of each model, not the vehicles described. Nothing here is for sale.
        </p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <FiltersPanel filters={filters} makes={makes} activeCount={chips.length} />
        <div className="min-w-0">
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  scroll={false}
                  className="group inline-flex items-center gap-2 border border-line-strong bg-charcoal px-3 py-1.5 text-xs text-silver transition-colors hover:border-white hover:text-white"
                  aria-label={`Remove filter: ${c.label}`}
                >
                  {c.label}
                  <span aria-hidden="true" className="text-dim group-hover:text-white">×</span>
                </Link>
              ))}
              <Link href="/cars" className="ml-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted hover:text-white">Clear all</Link>
            </div>
          )}

          {result.priceFilterSameCurrencyOnly && (
            <p className="mb-6 text-xs leading-relaxed text-muted">
              Exchange rates are not configured, so the price filter only matches listings priced in {filters.priceCurrency ?? "USD"}.
            </p>
          )}

          {result.vehicles.length > 0 ? (
            <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 2xl:grid-cols-3">
              {result.vehicles.map((v, i) => (
                <li key={v.id} className="bg-obsidian">
                  <VehicleCard vehicle={v} priority={i < 2} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No vehicles found"
              action={<ButtonLink href="/cars" variant="secondary">Reset all filters</ButtonLink>}
            >
              Try removing a filter, widening the price range or searching another country. New listings are added as sellers publish them.
            </EmptyState>
          )}

          <div className="mt-12">
            <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={hrefFor} />
          </div>
        </div>
      </div>
    </div>
  );
}
