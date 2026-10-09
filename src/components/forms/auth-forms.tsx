"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/form";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/format";
import type { ActionResult } from "@/lib/types";

export function SignInForm({ next, disabled }: { next?: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signIn, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" error={e.email}>
        {({ id, invalid, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" required disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <Field label="Password" error={e.password}>
        {({ id, invalid, describedBy }) => <Input id={id} name="password" type="password" autoComplete="current-password" required disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-muted underline-offset-4 hover:text-white hover:underline">Forgot password?</Link>
      </div>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>Sign in</Button>
    </form>
  );
}

const ACCOUNT_TYPES = [
  { value: "buyer", title: "Buyer", body: "Save vehicles, compare and track your enquiries." },
  { value: "private_seller", title: "Private seller", body: "List your own vehicle and manage enquiries." },
  { value: "dealer", title: "Dealership", body: "A storefront, inventory tools and business verification." },
] as const;

export function SignUpForm({ initialType, disabled }: { initialType: "buyer" | "private_seller" | "dealer"; disabled?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signUp, null);
  const [type, setType] = useState(initialType);
  const e = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.ok) track(type === "buyer" ? "buyer_signup" : type === "dealer" ? "dealer_onboarding" : "seller_signup");
  }, [state, type]);

  if (state?.ok) {
    return (
      <div className="border border-success/30 bg-success/[0.04] p-6" role="status">
        <p className="eyebrow text-success">Check your inbox</p>
        <p className="mt-3 text-sm leading-relaxed text-silver">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-6">
      <fieldset>
        <legend className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted">I want to</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ACCOUNT_TYPES.map((t) => (
            <label
              key={t.value}
              className={cn(
                "relative cursor-pointer border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-electric",
                type === t.value ? "border-white bg-white/[0.04]" : "border-line hover:border-line-strong",
              )}
            >
              <input type="radio" name="accountType" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="sr-only" />
              <span className="block font-display text-sm uppercase tracking-wide text-white">{t.title}</span>
              <span className="mt-2 block text-xs leading-relaxed text-muted">{t.body}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={type === "dealer" ? "Your name" : "Display name"} required error={e.displayName} hint={type === "private_seller" ? "Shown on your listings. You can use a first name only." : undefined}>
        {({ id, invalid, describedBy }) => <Input id={id} name="displayName" autoComplete="name" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      {type === "dealer" && (
        <Field label="Dealership name" required error={e.businessName}>
          {({ id, invalid, describedBy }) => <Input id={id} name="businessName" autoComplete="organization" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
      )}
      <Field label="Email" required error={e.email}>
        {({ id, invalid, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <Field label="Password" required error={e.password} hint="At least 10 characters.">
        {({ id, invalid, describedBy }) => <Input id={id} name="password" type="password" autoComplete="new-password" minLength={10} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <div>
        <Checkbox
          name="acceptTerms"
          disabled={disabled}
          label={<>I agree to the <Link href="/terms" className="underline underline-offset-2 hover:text-white">terms of service</Link> and have read the <Link href="/privacy" className="underline underline-offset-2 hover:text-white">privacy policy</Link>.</>}
        />
        {e.acceptTerms && <p className="mt-2 text-xs text-danger" role="alert">{e.acceptTerms}</p>}
      </div>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>Create account</Button>
    </form>
  );
}

export function ForgotPasswordForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(requestPasswordReset, null);
  if (state?.ok) return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} noValidate className="space-y-5">
      <Field label="Email" error={state?.fieldErrors?.email}>
        {({ id, invalid, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      {state && !state.ok && !state.fieldErrors && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" size="lg" className="w-full" loading={pending} disabled={disabled}>Send reset link</Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updatePassword, null);
  const e = state?.fieldErrors ?? {};
  if (state?.ok) {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Link href="/account" className="inline-block text-sm text-white underline underline-offset-4">Go to your account</Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="space-y-5">
      <Field label="New password" error={e.password} hint="At least 10 characters.">
        {({ id, invalid, describedBy }) => <Input id={id} name="password" type="password" autoComplete="new-password" aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <Field label="Confirm password" error={e.confirm}>
        {({ id, invalid, describedBy }) => <Input id={id} name="confirm" type="password" autoComplete="new-password" aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      {state && !state.ok && !state.fieldErrors && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Update password</Button>
    </form>
  );
}
