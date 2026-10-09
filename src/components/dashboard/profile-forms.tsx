"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createLogoUpload, requestVerification, saveDealerProfile, updateProfile } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { MARKETS } from "@/config/markets";
import { publicEnv } from "@/lib/env";
import { track } from "@/lib/analytics";
import type { ActionResult } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function DealerProfileForm({ dealer, onboarding = false }: { dealer: Record<string, any> | null; onboarding?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveDealerProfile, null);
  const [logoPath, setLogoPath] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(dealer?.logo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const e = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!state) return;
    toast(state.message ?? "", state.ok ? "success" : "error");
    if (state.ok) {
      if (onboarding) {
        track("dealer_onboarding", { step: "storefront_created" });
        router.push("/dashboard/listings/new");
      } else router.refresh();
    }
  }, [state, toast, router, onboarding]);

  const onLogo = async (file: File) => {
    setUploading(true);
    try {
      const t = await createLogoUpload({ type: file.type, size: file.size });
      if (!t.ok || !t.data) throw new Error(t.message);
      const res = await fetch(t.data.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type, "x-upsert": "false", ...(publicEnv.supabaseKey ? { apikey: publicEnv.supabaseKey } : {}) },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      setLogoPath(t.data.path);
      setLogoPreview(URL.createObjectURL(file));
      toast("Logo uploaded — save the profile to apply it.", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form action={action} noValidate className="space-y-6">
      <input type="hidden" name="logo_path" value={logoPath} />
      <div className="flex items-center gap-5">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden border border-line bg-ink">
          {logoPreview ? <Image src={logoPreview} alt="Dealership logo" fill sizes="80px" className="object-contain p-2" unoptimized={logoPreview.startsWith("blob:")} /> : <span className="text-[0.6rem] uppercase tracking-widest text-dim">Logo</span>}
        </div>
        <label className="cursor-pointer border border-line-strong px-4 py-2.5 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-white hover:border-white">
          {uploading ? "Uploading…" : "Upload logo"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(ev) => ev.target.files?.[0] && onLogo(ev.target.files[0])} />
        </label>
        <span className="text-xs text-dim">PNG, JPEG or WebP · up to 2 MB</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business name" required error={e.businessName} className="sm:col-span-2">
          {({ id, invalid }) => <Input id={id} name="businessName" defaultValue={dealer?.business_name ?? ""} aria-invalid={invalid} autoComplete="organization" />}
        </Field>
        <Field label="About the dealership" error={e.description} className="sm:col-span-2" hint="Shown on your public storefront.">
          {({ id }) => <Textarea id={id} name="description" defaultValue={dealer?.description ?? ""} maxLength={4000} />}
        </Field>
        <Field label="Country" required error={e.countryCode}>
          {({ id, invalid }) => (
            <Select id={id} name="countryCode" defaultValue={dealer?.country_code?.trim() ?? ""} aria-invalid={invalid}>
              <option value="" disabled>Choose a country</option>
              {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="City" required error={e.city}>
          {({ id, invalid }) => <Input id={id} name="city" defaultValue={dealer?.city ?? ""} aria-invalid={invalid} />}
        </Field>
        <Field label="Region / state" error={e.region}>
          {({ id }) => <Input id={id} name="region" defaultValue={dealer?.region ?? ""} />}
        </Field>
        <Field label="Showroom address" error={e.addressLine} hint="Optional — public business address only.">
          {({ id }) => <Input id={id} name="addressLine" defaultValue={dealer?.address_line ?? ""} />}
        </Field>
        <Field label="Website" error={e.website}>
          {({ id, invalid }) => <Input id={id} name="website" type="url" defaultValue={dealer?.website ?? ""} placeholder="https://" aria-invalid={invalid} />}
        </Field>
        <Field label="Public email" error={e.publicEmail}>
          {({ id, invalid }) => <Input id={id} name="publicEmail" type="email" defaultValue={dealer?.public_email ?? ""} aria-invalid={invalid} />}
        </Field>
        <Field label="Public phone" error={e.publicPhone}>
          {({ id, invalid }) => <Input id={id} name="publicPhone" type="tel" defaultValue={dealer?.public_phone ?? ""} aria-invalid={invalid} />}
        </Field>
        <Field label="WhatsApp number" error={e.whatsapp} hint="International format. Enables WhatsApp enquiries on your listings.">
          {({ id, invalid }) => <Input id={id} name="whatsapp" type="tel" defaultValue={dealer?.whatsapp ?? ""} placeholder="+971501234567" aria-invalid={invalid} />}
        </Field>
      </div>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" loading={pending} disabled={uploading}>{dealer ? "Save storefront" : "Create storefront"}</Button>
    </form>
  );
}

export function ProfileForm({ profile, phone }: { profile: Record<string, any> | null; phone: string | null }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateProfile, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Display name" required error={e.displayName} hint="Shown publicly on listings if you sell privately.">
          {({ id, invalid }) => <Input id={id} name="displayName" defaultValue={profile?.display_name ?? ""} aria-invalid={invalid} autoComplete="name" />}
        </Field>
        <Field label="Phone (private)" error={e.phone} hint="Never shown publicly.">
          {({ id, invalid }) => <Input id={id} name="phone" type="tel" defaultValue={phone ?? ""} aria-invalid={invalid} autoComplete="tel" />}
        </Field>
        <Field label="Country" error={e.countryCode}>
          {({ id }) => (
            <Select id={id} name="countryCode" defaultValue={profile?.country_code?.trim() ?? ""}>
              <option value="">Not specified</option>
              {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="City" error={e.city}>
          {({ id }) => <Input id={id} name="city" defaultValue={profile?.city ?? ""} autoComplete="address-level2" />}
        </Field>
        <Field label="About you" error={e.bio} className="sm:col-span-2" hint="Optional. Shown on your public seller profile.">
          {({ id }) => <Textarea id={id} name="bio" defaultValue={profile?.bio ?? ""} maxLength={1000} className="min-h-24" />}
        </Field>
      </div>
      {state && <FormMessage tone={state.ok ? "success" : "error"}>{state.message}</FormMessage>}
      <Button type="submit" loading={pending}>Save profile</Button>
    </form>
  );
}

export function VerificationForm({ kind }: { kind: "identity" | "business" }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(requestVerification, null);
  const router = useRouter();
  const e = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  if (state?.ok) return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={kind === "business" ? "Registered legal name" : "Full legal name"} required error={e.legal_name || undefined}>
          {({ id, invalid }) => <Input id={id} name="legal_name" aria-invalid={invalid} />}
        </Field>
        {kind === "business" ? (
          <Field label="Company registration number" required error={e.registration_number || undefined}>
            {({ id, invalid }) => <Input id={id} name="registration_number" aria-invalid={invalid} />}
          </Field>
        ) : (
          <Field label="Country of residence">
            {({ id }) => (
              <Select id={id} name="registration_country" defaultValue="">
                <option value="">Choose</option>
                {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
              </Select>
            )}
          </Field>
        )}
        {kind === "business" && (
          <Field label="Country of registration">
            {({ id }) => (
              <Select id={id} name="registration_country" defaultValue="">
                <option value="">Choose</option>
                {MARKETS.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
              </Select>
            )}
          </Field>
        )}
        <Field label="Notes for the reviewer" className="sm:col-span-2" hint="Do not enter ID or bank account numbers here. A reviewer will contact you to collect documents securely.">
          {({ id }) => <Textarea id={id} name="applicant_note" maxLength={2000} className="min-h-24" />}
        </Field>
      </div>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" loading={pending}>Submit for verification</Button>
    </form>
  );
}
