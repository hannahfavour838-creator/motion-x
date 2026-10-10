import Image from "next/image";
import Link from "next/link";
import { countryName } from "@/config/markets";
import { LABELS } from "@/config/vehicles";
import { cn, formatMileage, localeFor, vehicleHref } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/misc";
import { Price } from "./price";
import { SellerBadges } from "./seller-badges";
import { CompareButton, SaveButton } from "./vehicle-actions";

export function VehicleCard({ vehicle: v, priority = false, className }: { vehicle: Vehicle; priority?: boolean; className?: string }) {
  const img = v.images[0];
  const locale = localeFor(v.countryCode);
  const title = `${v.year} ${v.make} ${v.model}`;
  return (
    <article className={cn("group relative flex flex-col bg-ink transition-colors duration-500 hover:bg-charcoal", className)}>
      <div className="relative aspect-[3/2] overflow-hidden bg-charcoal">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt || title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-cinematic)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-dim">Photos coming soon</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.isDemo && <Badge tone="warning" className="bg-obsidian/80 backdrop-blur">Demo vehicle</Badge>}
          {v.status === "sold" && <Badge tone="danger" className="bg-obsidian/80 backdrop-blur">Sold</Badge>}
          {v.condition === "new" && <Badge tone="electric" className="bg-obsidian/80 backdrop-blur">New</Badge>}
        </div>
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <CompareButton vehicleId={v.id} />
          <SaveButton vehicleId={v.id} />
        </div>
        {img?.illustrative && (
          <p className="absolute bottom-2.5 left-3 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-white/70">Representative photo</p>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">{v.year} · {LABELS.condition[v.condition]}</p>
            <h3 className="mt-2 truncate font-display text-lg font-medium uppercase leading-tight tracking-wide text-white">
              <Link href={vehicleHref(v)} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline after:focus-visible:outline-2 after:focus-visible:outline-electric">
                {v.make} {v.model}
              </Link>
            </h3>
            {v.variant && <p className="mt-1 truncate text-sm text-muted">{v.variant}</p>}
          </div>
        </div>
        <Price amount={v.price} currency={v.currency} locale={locale} className="mt-4" />
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-4 text-xs">
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="truncate text-silver">{v.city}, {countryName(v.countryCode)}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Mileage</dt>
            <dd className="text-silver tabular-nums">{formatMileage(v.mileage, v.mileageUnit, locale)}</dd>
          </div>
          <div>
            <dt className="sr-only">Transmission and fuel</dt>
            <dd className="truncate text-muted">{LABELS.fuelType[v.fuelType]} · {LABELS.transmission[v.transmission]}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Seller type</dt>
            <dd className="text-muted">{LABELS.sellerType[v.seller.type]}</dd>
          </div>
        </dl>
        <div className="relative z-10 mt-4 flex items-center justify-between gap-3">
          <SellerBadges seller={v.seller} size="sm" />
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-silver transition-colors group-hover:text-white" aria-hidden="true">
            View details →
          </span>
        </div>
      </div>
    </article>
  );
}
