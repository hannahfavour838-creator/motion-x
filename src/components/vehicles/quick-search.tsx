"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MARKETS, CURRENCIES } from "@/config/markets";
import { Button, ArrowRight } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/form";
import { track } from "@/lib/analytics";

/**
 * Marketplace quick search. A plain GET form to /cars, so it works without
 * JavaScript; with JS we drop empty fields for clean, shareable URLs.
 */
export function QuickSearch({ makes, defaultCurrency = "USD" }: { makes: string[]; defaultCurrency?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const sp = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      const val = String(v).trim();
      if (val) sp.set(k, val);
    }
    if (!sp.get("min_price") && !sp.get("max_price")) sp.delete("cur");
    setPending(true);
    track("search", { source: "home" });
    router.push(`/cars${sp.toString() ? `?${sp}` : ""}`);
  };

  return (
    <form action="/cars" method="get" onSubmit={onSubmit} role="search" aria-label="Search vehicles" className="border border-line bg-ink/80 p-5 backdrop-blur md:p-8">
      <div className="grid gap-5 md:grid-cols-12">
        <div className="md:col-span-4">
          <Label htmlFor="qs-q">Make or model</Label>
          <Input id="qs-q" name="q" list="qs-makes" placeholder="e.g. Porsche 911, Land Cruiser" autoComplete="off" />
          <datalist id="qs-makes">
            {makes.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="qs-country">Country</Label>
          <Select id="qs-country" name="country" defaultValue="">
            <option value="">All countries</option>
            {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="qs-condition">Condition</Label>
          <Select id="qs-condition" name="condition" defaultValue="">
            <option value="">New & used</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="qs-cur">Currency</Label>
          <Select id="qs-cur" name="cur" defaultValue={defaultCurrency}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="qs-min">Minimum price</Label>
          <Input id="qs-min" name="min_price" inputMode="numeric" pattern="[0-9,\s]*" placeholder="No minimum" />
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="qs-max">Maximum price</Label>
          <Input id="qs-max" name="max_price" inputMode="numeric" pattern="[0-9,\s]*" placeholder="No maximum" />
        </div>
        <div className="flex items-end md:col-span-6 md:justify-end">
          <Button type="submit" size="lg" className="w-full md:w-auto" loading={pending} iconRight={<ArrowRight />}>
            Search vehicles
          </Button>
        </div>
      </div>
    </form>
  );
}
