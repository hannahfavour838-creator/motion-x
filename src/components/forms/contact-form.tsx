"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/app/actions/public";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionResult } from "@/lib/types";
import { BotFields } from "./form-kit";

const TOPICS = { buying: "Buying a vehicle", selling: "Selling a vehicle", dealer: "Dealerships", trust: "Trust, safety & privacy", press: "Press", other: "Something else" };

export function ContactForm({ defaultTopic }: { defaultTopic: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(sendContactMessage, null);
  const e = state?.fieldErrors ?? {};
  if (state?.ok) return <FormMessage tone="success">{state.message}</FormMessage>;
  return (
    <form action={action} noValidate className="relative space-y-5">
      <BotFields />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required error={e.name}>{({ id, invalid }) => <Input id={id} name="name" autoComplete="name" aria-invalid={invalid} />}</Field>
        <Field label="Email" required error={e.email}>{({ id, invalid }) => <Input id={id} name="email" type="email" autoComplete="email" aria-invalid={invalid} />}</Field>
      </div>
      <Field label="Topic" error={e.topic}>
        {({ id }) => (
          <Select id={id} name="topic" defaultValue={defaultTopic in TOPICS ? defaultTopic : "other"}>
            {Object.entries(TOPICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Message" required error={e.message}>{({ id, invalid }) => <Textarea id={id} name="message" maxLength={4000} aria-invalid={invalid} />}</Field>
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <Button type="submit" loading={pending}>Send message</Button>
    </form>
  );
}
