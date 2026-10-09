"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { replyToEnquiry, setEnquiryStatus, setInspectionStatus } from "@/app/actions/seller";
import { Button } from "@/components/ui/button";
import { FormMessage, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/types";

export function ReplyForm({ enquiryId }: { enquiryId: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(replyToEnquiry.bind(null, enquiryId), null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      router.refresh();
    }
  }, [state, router]);
  return (
    <form ref={form} action={action} className="space-y-3">
      <label htmlFor="reply" className="sr-only">Your reply</label>
      <Textarea id="reply" name="body" required maxLength={3000} placeholder="Write a reply…" className="min-h-28" />
      {state && !state.ok && <FormMessage>{state.message}</FormMessage>}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Send reply</Button>
      </div>
    </form>
  );
}

export function EnquiryStatusControls({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const set = (s: "read" | "closed" | "spam" | "new") =>
    start(async () => {
      const r = await setEnquiryStatus(id, s);
      toast(r.message ?? "", r.ok ? "success" : "error");
      router.refresh();
    });
  const btn = "h-9 border border-line-strong px-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white hover:border-white disabled:opacity-40";
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {status === "new" && <button type="button" className={btn} onClick={() => set("read")} disabled={pending}>Mark read</button>}
      {status !== "closed" && <button type="button" className={btn} onClick={() => set("closed")} disabled={pending}>Close</button>}
      {status === "closed" && <button type="button" className={btn} onClick={() => set("read")} disabled={pending}>Reopen</button>}
      {status !== "spam" && <button type="button" className={`${btn} border-danger/40 text-danger`} onClick={() => set("spam")} disabled={pending}>Mark as spam</button>}
    </div>
  );
}

/** Marks a new enquiry as read when the seller opens it. */
export function AutoMarkRead({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status !== "new") return;
    void setEnquiryStatus(id, "read").then(() => router.refresh());
  }, [id, status, router]);
  return null;
}

export function InspectionControls({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const set = (s: "acknowledged" | "scheduled" | "completed" | "declined") =>
    start(async () => {
      const r = await setInspectionStatus(id, s);
      toast(r.message ?? "", r.ok ? "success" : "error");
      router.refresh();
    });
  const next: Record<string, ("acknowledged" | "scheduled" | "completed" | "declined")[]> = {
    requested: ["acknowledged", "declined"],
    acknowledged: ["scheduled", "declined"],
    scheduled: ["completed", "declined"],
  };
  const options = next[status] ?? [];
  if (!options.length) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {options.map((s) => (
        <button key={s} type="button" disabled={pending} onClick={() => set(s)} className="h-9 border border-line-strong px-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white hover:border-white disabled:opacity-40">
          {s === "acknowledged" ? "Acknowledge" : s === "scheduled" ? "Mark scheduled" : s === "completed" ? "Mark completed" : "Decline"}
        </button>
      ))}
    </div>
  );
}
