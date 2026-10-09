"use client";

import { useActionState, useEffect, useState } from "react";
import { reportListing, requestInspection, submitEnquiry } from "@/app/actions/public";
import { BotFields } from "@/components/forms/form-kit";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { track } from "@/lib/analytics";
import type { ActionResult } from "@/lib/types";
import { REPORT_REASONS } from "@/lib/validation";

export function EnquiryForm({ vehicleId, vehicleTitle, whatsappEnabled }: { vehicleId: string; vehicleTitle: string; whatsappEnabled: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(submitEnquiry, null);
  const e = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.ok) track("enquiry_submitted");
  }, [state]);

  if (state?.ok) {
    return (
      <div className="border border-success/30 bg-success/[0.04] p-6" role="status">
        <p className="eyebrow text-success">Enquiry sent</p>
        <p className="mt-3 text-sm leading-relaxed text-silver">{state.message}</p>
        <p className="mt-3 text-xs text-dim">Never send deposits or payments before you have seen the vehicle and verified the seller.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative space-y-5" aria-label={`Contact the seller about ${vehicleTitle}`}>
      <BotFields />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Field label="Your name" required error={e.name}>
        {({ id, describedBy, invalid }) => <Input id={id} name="name" autoComplete="name" required aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" required error={e.email}>
          {({ id, describedBy, invalid }) => <Input id={id} name="email" type="email" autoComplete="email" required aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Phone" error={e.phone} hint="Optional">
          {({ id, describedBy, invalid }) => <Input id={id} name="phone" type="tel" autoComplete="tel" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
      </div>
      <Field label="Preferred contact" error={e.preferredContact}>
        {({ id }) => (
          <Select id={id} name="preferredContact" defaultValue="email">
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            {whatsappEnabled && <option value="whatsapp">WhatsApp</option>}
          </Select>
        )}
      </Field>
      <Field label="Message" required error={e.message}>
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            name="message"
            required
            maxLength={3000}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            defaultValue={`Hello, I'm interested in the ${vehicleTitle}. Is it still available?`}
          />
        )}
      </Field>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Send enquiry</Button>
      <p className="text-xs leading-relaxed text-dim">
        We share your name, contact details and message only with this seller. See our <a href="/privacy" className="underline underline-offset-2 hover:text-white">privacy policy</a>.
      </p>
    </form>
  );
}

function InspectionForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(requestInspection, null);
  const e = state?.fieldErrors ?? {};
  useEffect(() => {
    if (state?.ok) track("inspection_requested");
  }, [state]);
  if (state?.ok) {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Button variant="secondary" onClick={onDone}>Close</Button>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="relative space-y-5">
      <BotFields />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <p className="text-sm leading-relaxed text-muted">
        MOTION X does not inspect vehicles. This request asks the seller to make the vehicle available to an independent
        inspector of your choice, at your cost.
      </p>
      <Field label="Your name" required error={e.name}>
        {({ id, invalid, describedBy }) => <Input id={id} name="name" autoComplete="name" aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" required error={e.email}>
          {({ id, invalid, describedBy }) => <Input id={id} name="email" type="email" autoComplete="email" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Phone" error={e.phone} hint="Optional">
          {({ id, invalid, describedBy }) => <Input id={id} name="phone" type="tel" autoComplete="tel" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred date" error={e.preferredDate} hint="Optional">
          {({ id, invalid, describedBy }) => <Input id={id} name="preferredDate" type="date" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
        <Field label="Inspector / company" error={e.inspector} hint="Optional">
          {({ id, invalid, describedBy }) => <Input id={id} name="inspector" aria-invalid={invalid} aria-describedby={describedBy} />}
        </Field>
      </div>
      <Field label="Notes for the seller" error={e.message} hint="Optional">
        {({ id, invalid, describedBy }) => <Textarea id={id} name="message" className="min-h-24" aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" className="w-full" loading={pending}>Request inspection</Button>
    </form>
  );
}

function ReportForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(reportListing, null);
  const e = state?.fieldErrors ?? {};
  if (state?.ok) {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Button variant="secondary" onClick={onDone}>Close</Button>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="relative space-y-5">
      <BotFields />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <Field label="Reason" required error={e.reason}>
        {({ id, invalid }) => (
          <Select id={id} name="reason" defaultValue="" aria-invalid={invalid} required>
            <option value="" disabled>Choose a reason</option>
            {Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Details" error={e.details} hint="What should our team know?">
        {({ id, invalid, describedBy }) => <Textarea id={id} name="details" maxLength={2000} aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      <Field label="Your email" error={e.contactEmail} hint="Optional — only if you'd like us to follow up">
        {({ id, invalid, describedBy }) => <Input id={id} name="contactEmail" type="email" autoComplete="email" aria-invalid={invalid} aria-describedby={describedBy} />}
      </Field>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" variant="danger" className="w-full" loading={pending}>Submit report</Button>
    </form>
  );
}

export function InspectionButton({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center justify-center gap-2.5 border border-line-strong px-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white transition-colors hover:border-white">
        Request inspection
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Request an inspection" size="lg">
        {open && <InspectionForm vehicleId={vehicleId} onDone={() => setOpen(false)} />}
      </Modal>
    </>
  );
}

export function ReportButton({ vehicleId }: { vehicleId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted transition-colors hover:text-danger">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>
        Report listing
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report this listing" description="Reports are confidential and reviewed by the MOTION X team.">
        {open && <ReportForm vehicleId={vehicleId} onDone={() => setOpen(false)} />}
      </Modal>
    </>
  );
}
