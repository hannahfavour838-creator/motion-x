"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CURRENCIES, MARKETS } from "@/config/markets";
import { BODY_STYLES, FUEL_TYPES, LABELS, SEGMENTS, TRANSMISSIONS } from "@/config/vehicles";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { track } from "@/lib/analytics";
import type { SearchFilters } from "@/lib/types";

const YEAR_NOW = new Date().getFullYear() + 1;

function FilterFields({ f, makes, idp }: { f: SearchFilters; makes: string[]; idp: string }) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor={`${idp}-q`}>Keywords</Label>
        <Input id={`${idp}-q`} name="q" defaultValue={f.q ?? ""} placeholder="Model, variant, colour…" />
      </div>
      <div>
        <Label htmlFor={`${idp}-make`}>Make</Label>
        <Select id={`${idp}-make`} name="make" defaultValue={f.make ?? ""}>
          <option value="">Any make</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor={`${idp}-country`}>Country</Label>
          <Select id={`${idp}-country`} name="country" defaultValue={f.country ?? ""}>
            <option value="">All countries</option>
            {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor={`${idp}-city`}>City</Label>
          <Input id={`${idp}-city`} name="city" defaultValue={f.city ?? ""} placeholder="Any city" />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted">Price</legend>
        <div className="grid grid-cols-[1fr_1fr_5.5rem] gap-2">
          <Input aria-label="Minimum price" name="min_price" inputMode="numeric" defaultValue={f.minPrice ?? ""} placeholder="Min" />
          <Input aria-label="Maximum price" name="max_price" inputMode="numeric" defaultValue={f.maxPrice ?? ""} placeholder="Max" />
          <Select aria-label="Price currency" name="cur" defaultValue={f.priceCurrency ?? "USD"} className="px-2">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted">Year</legend>
        <div className="grid grid-cols-2 gap-2">
          <Input aria-label="Minimum year" name="min_year" type="number" min={1886} max={YEAR_NOW} defaultValue={f.minYear ?? ""} placeholder="From" />
          <Input aria-label="Maximum year" name="max_year" type="number" min={1886} max={YEAR_NOW} defaultValue={f.maxYear ?? ""} placeholder="To" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted">Mileage</legend>
        <div className="grid grid-cols-[1fr_1fr_5.5rem] gap-2">
          <Input aria-label="Minimum mileage" name="min_mileage" inputMode="numeric" defaultValue={f.minMileage ?? ""} placeholder="Min" />
          <Input aria-label="Maximum mileage" name="max_mileage" inputMode="numeric" defaultValue={f.maxMileage ?? ""} placeholder="Max" />
          <Select aria-label="Mileage unit" name="unit" defaultValue={f.mileageUnit ?? "km"} className="px-2">
            <option value="km">km</option>
            <option value="mi">mi</option>
          </Select>
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idp}-condition`}>Condition</Label>
          <Select id={`${idp}-condition`} name="condition" defaultValue={f.condition ?? ""}>
            <option value="">Any</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idp}-seller`}>Seller</Label>
          <Select id={`${idp}-seller`} name="seller" defaultValue={f.sellerType ?? ""}>
            <option value="">Any</option>
            <option value="dealer">Dealership</option>
            <option value="private">Private</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor={`${idp}-segment`}>Category</Label>
        <Select id={`${idp}-segment`} name="segment" defaultValue={f.segment ?? ""}>
          <option value="">All categories</option>
          {SEGMENTS.map((s) => <option key={s} value={s}>{LABELS.segment[s]}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idp}-body`}>Body style</Label>
        <Select id={`${idp}-body`} name="body" defaultValue={f.body ?? ""}>
          <option value="">Any body style</option>
          {BODY_STYLES.map((s) => <option key={s} value={s}>{LABELS.bodyStyle[s]}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${idp}-transmission`}>Gearbox</Label>
          <Select id={`${idp}-transmission`} name="transmission" defaultValue={f.transmission ?? ""}>
            <option value="">Any</option>
            {TRANSMISSIONS.map((s) => <option key={s} value={s}>{LABELS.transmission[s]}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idp}-fuel`}>Fuel</Label>
          <Select id={`${idp}-fuel`} name="fuel" defaultValue={f.fuel ?? ""}>
            <option value="">Any</option>
            {FUEL_TYPES.map((s) => <option key={s} value={s}>{LABELS.fuelType[s]}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor={`${idp}-availability`}>Availability</Label>
        <Select id={`${idp}-availability`} name="availability" defaultValue={f.availability ?? "available"}>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="all">Available &amp; sold</option>
        </Select>
      </div>
      <Checkbox name="has3d" value="1" defaultChecked={Boolean(f.has3d)} label="Only vehicles with a 3D showroom" />
    </div>
  );
}

function useApply(sort?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const apply = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const sp = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      const val = String(v).trim();
      if (!val) continue;
      if (k === "availability" && val === "available") continue;
      sp.set(k, val);
    }
    if (!sp.get("min_price") && !sp.get("max_price")) sp.delete("cur");
    if (!sp.get("max_mileage") && !sp.get("min_mileage")) sp.delete("unit");
    if (sort && sort !== "relevance") sp.set("sort", sort);
    track("search", { source: "filters" });
    start(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false }));
  };
  return { apply, pending };
}

export function FiltersPanel({ filters, makes, activeCount }: { filters: SearchFilters; makes: string[]; activeCount: number }) {
  const { apply, pending } = useApply(filters.sort);
  const [open, setOpen] = useState(false);
  const key = JSON.stringify(filters);

  const form = (id: string, onDone?: () => void) => (
    <form
      key={key + id}
      action="/cars"
      method="get"
      aria-label="Filter vehicles"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
        onDone?.();
      }}
    >
      <FilterFields f={filters} makes={makes} idp={`f-${id}`} />
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      <div className="sticky bottom-0 mt-8 flex gap-3 bg-obsidian py-4">
        <Button type="submit" className="flex-1" loading={pending}>Apply filters</Button>
        <Link href="/cars" onClick={onDone} className="inline-flex h-11 items-center px-4 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted hover:text-white">Reset</Link>
      </div>
    </form>
  );

  return (
    <>
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2 scrollbar-none">{form("desktop")}</div>
      </aside>
      <div className="lg:hidden">
        <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Filter vehicles">
          {form("mobile", () => setOpen(false))}
        </Modal>
      </div>
    </>
  );
}

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();
  return (
    <label className="flex items-center gap-3">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const sp = new URLSearchParams(window.location.search);
          if (e.target.value === "relevance") sp.delete("sort"); else sp.set("sort", e.target.value);
          sp.delete("page");
          start(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false }));
        }}
        className="h-10 cursor-pointer rounded-xs border border-line bg-charcoal px-3 text-sm text-white focus:border-electric focus:outline-none"
      >
        <option value="relevance">Relevance</option>
        <option value="newest">Recently published</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="year_desc">Year: newest first</option>
        <option value="year_asc">Year: oldest first</option>
        <option value="mileage_asc">Mileage: lowest first</option>
      </select>
    </label>
  );
}
