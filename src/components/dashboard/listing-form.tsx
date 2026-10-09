"use client";

import { useActionState, useEffect, useState } from "react";
import { createListing, updateListing } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { CURRENCIES, MARKETS, getMarket } from "@/config/markets";
import { BODY_STYLES, DRIVETRAINS, FUEL_TYPES, LABELS, POPULAR_MAKES, SEGMENTS, TRANSMISSIONS } from "@/config/vehicles";
import { track } from "@/lib/analytics";
import type { ActionResult, Vehicle } from "@/lib/types";

function Section({ title, step, children }: { title: string; step: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-8">
      <legend className="sr-only">{title}</legend>
      <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
        <div aria-hidden="true">
          <p className="font-mono text-[0.65rem] text-electric">{step}</p>
          <p className="mt-2 font-display text-sm uppercase tracking-wide text-white">{title}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">{children}</div>
      </div>
    </fieldset>
  );
}

export function ListingForm({ vehicle, defaultCountry }: { vehicle?: Vehicle; defaultCountry?: string | null }) {
  const action = vehicle ? updateListing.bind(null, vehicle.id) : createListing;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const toast = useToast();
  const initialCountry = vehicle?.countryCode ?? defaultCountry ?? "";
  const [country, setCountry] = useState(initialCountry);
  const market = getMarket(country);
  const [currency, setCurrency] = useState(vehicle?.currency ?? market?.currency ?? "USD");
  const [unit, setUnit] = useState<"km" | "mi">(vehicle?.mileageUnit ?? market?.distanceUnit ?? "km");
  const [touched, setTouched] = useState({ currency: Boolean(vehicle), unit: Boolean(vehicle) });
  const e = state?.fieldErrors ?? {};
  const canSubmit = !vehicle || ["draft", "rejected"].includes(vehicle.status);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast(state.message ?? "Saved.", "success");
      if (state.message?.startsWith("Submitted")) track("listing_submitted");
    } else if (state.message) {
      toast(state.message, "error");
    }
  }, [state, toast]);

  const onCountry = (code: string) => {
    setCountry(code);
    const m = getMarket(code);
    if (m && !touched.currency) setCurrency(m.currency);
    if (m && !touched.unit) setUnit(m.distanceUnit);
  };

  const v = vehicle;
  return (
    <form action={formAction} noValidate className="space-y-10">
      <Section title="The vehicle" step="01">
        <Field label="Make" required error={e.make}>
          {({ id, invalid, describedBy }) => (
            <>
              <Input id={id} name="make" list="lf-makes" defaultValue={v?.make} aria-invalid={invalid} aria-describedby={describedBy} autoComplete="off" />
              <datalist id="lf-makes">{POPULAR_MAKES.map((m) => <option key={m} value={m} />)}</datalist>
            </>
          )}
        </Field>
        <Field label="Model" required error={e.model}>
          {({ id, invalid, describedBy }) => <Input id={id} name="model" defaultValue={v?.model} aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Variant / trim" error={e.variant} hint="e.g. Carrera S, GT-Line, 300 GR Sport">
          {({ id, invalid, describedBy }) => <Input id={id} name="variant" defaultValue={v?.variant ?? ""} aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Year" required error={e.year}>
          {({ id, invalid, describedBy }) => <Input id={id} name="year" type="number" inputMode="numeric" min={1886} max={new Date().getFullYear() + 1} defaultValue={v?.year} aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Condition" required error={e.condition}>
          {({ id }) => (
            <Select id={id} name="condition" defaultValue={v?.condition ?? "used"}>
              <option value="used">Used</option>
              <option value="new">New</option>
            </Select>
          )}
        </Field>
        <Field label="Category" required error={e.segment} hint="Used for collections such as Supercars or Everyday.">
          {({ id }) => (
            <Select id={id} name="segment" defaultValue={v?.segment ?? "everyday"}>
              {SEGMENTS.map((s) => <option key={s} value={s}>{LABELS.segment[s]}</option>)}
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Price & location" step="02">
        <Field label="Asking price" required error={e.price}>
          {({ id, invalid, describedBy }) => <Input id={id} name="price" inputMode="decimal" defaultValue={v?.price} aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Currency" required error={e.currency} hint="Buyers always see this original price.">
          {({ id }) => (
            <Select id={id} name="currency" value={currency} onChange={(ev) => { setCurrency(ev.target.value); setTouched((t) => ({ ...t, currency: true })); }}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Country" required error={e.countryCode}>
          {({ id, invalid }) => (
            <Select id={id} name="countryCode" value={country} onChange={(ev) => onCountry(ev.target.value)} aria-invalid={invalid}>
              <option value="" disabled>Choose a country</option>
              {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="City" required error={e.city}>
          {({ id, invalid, describedBy }) => <Input id={id} name="city" defaultValue={v?.city} autoComplete="address-level2" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Region / state" error={e.region} hint="Optional. Never enter your street address.">
          {({ id }) => <Input id={id} name="region" defaultValue={v?.region ?? ""} autoComplete="address-level1" />}
        </Field>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Field label="Mileage" required error={e.mileage}>
            {({ id, invalid, describedBy }) => <Input id={id} name="mileage" inputMode="numeric" defaultValue={v?.mileage} aria-invalid={invalid} aria-describedby={describedBy} />}
          </Field>
          <Field label="Unit">
            {({ id }) => (
              <Select id={id} name="mileageUnit" value={unit} onChange={(ev) => { setUnit(ev.target.value as "km" | "mi"); setTouched((t) => ({ ...t, unit: true })); }} className="px-3">
                <option value="km">km</option>
                <option value="mi">mi</option>
              </Select>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Specification" step="03">
        <Field label="Body style" required error={e.bodyStyle}>
          {({ id, invalid }) => (
            <Select id={id} name="bodyStyle" defaultValue={v?.bodyStyle ?? ""} aria-invalid={invalid}>
              <option value="" disabled>Choose</option>
              {BODY_STYLES.map((s) => <option key={s} value={s}>{LABELS.bodyStyle[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Transmission" required error={e.transmission}>
          {({ id, invalid }) => (
            <Select id={id} name="transmission" defaultValue={v?.transmission ?? ""} aria-invalid={invalid}>
              <option value="" disabled>Choose</option>
              {TRANSMISSIONS.map((s) => <option key={s} value={s}>{LABELS.transmission[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Fuel type" required error={e.fuelType}>
          {({ id, invalid }) => (
            <Select id={id} name="fuelType" defaultValue={v?.fuelType ?? ""} aria-invalid={invalid}>
              <option value="" disabled>Choose</option>
              {FUEL_TYPES.map((s) => <option key={s} value={s}>{LABELS.fuelType[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Drivetrain" error={e.drivetrain}>
          {({ id }) => (
            <Select id={id} name="drivetrain" defaultValue={v?.drivetrain ?? ""}>
              <option value="">Not specified</option>
              {DRIVETRAINS.map((s) => <option key={s} value={s}>{LABELS.drivetrain[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Engine" error={e.engine} hint="e.g. 3.0 L twin-turbo straight-six">
          {({ id }) => <Input id={id} name="engine" defaultValue={v?.engine ?? ""} />}
        </Field>
        <Field label="Power (hp)" error={e.powerHp}>
          {({ id, invalid }) => <Input id={id} name="powerHp" inputMode="numeric" defaultValue={v?.powerHp ?? ""} aria-invalid={invalid} />}
        </Field>
        <Field label="Exterior colour" error={e.exteriorColour}>
          {({ id }) => <Input id={id} name="exteriorColour" defaultValue={v?.exteriorColour ?? ""} />}
        </Field>
        <Field label="Interior" error={e.interiorColour}>
          {({ id }) => <Input id={id} name="interiorColour" defaultValue={v?.interiorColour ?? ""} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Doors" error={e.doors}>
            {({ id, invalid }) => <Input id={id} name="doors" inputMode="numeric" defaultValue={v?.doors ?? ""} aria-invalid={invalid} />}
          </Field>
          <Field label="Seats" error={e.seats}>
            {({ id, invalid }) => <Input id={id} name="seats" inputMode="numeric" defaultValue={v?.seats ?? ""} aria-invalid={invalid} />}
          </Field>
        </div>
      </Section>

      <Section title="Description" step="04">
        <Field label="Describe the vehicle" error={e.description} hint="History, options, service record, known issues. Be accurate — listings are reviewed." className="sm:col-span-2">
          {({ id, invalid, describedBy }) => <Textarea id={id} name="description" maxLength={8000} defaultValue={v?.description ?? ""} className="min-h-48" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <div className="sm:col-span-2">
          <Checkbox
            name="inspectionAvailable"
            defaultChecked={v?.inspectionAvailable}
            label="Allow buyers to request an independent pre-purchase inspection (arranged between you and the buyer)."
          />
        </div>
      </Section>

      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      {state?.ok && <FormMessage tone="success">{state.message}</FormMessage>}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 border-t border-line bg-obsidian/95 px-1 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="submit" name="intent" value="save" variant="secondary" loading={pending}>
          {vehicle ? "Save changes" : "Save draft & add photos"}
        </Button>
        {canSubmit && vehicle && (
          <Button type="submit" name="intent" value="submit" loading={pending} disabled={vehicle.images.length === 0} title={vehicle.images.length === 0 ? "Add at least one photograph first" : undefined}>
            Save &amp; submit for review
          </Button>
        )}
      </div>
    </form>
  );
}
