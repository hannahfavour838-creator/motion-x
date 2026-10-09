"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  markContactHandled, moderateListing, resolveReport, reviewVerification, revokeIdentityVerification, setAccountStatus, setModerationMode,
  type ListingDecision,
} from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import type { ActionResult } from "@/lib/types";

const btn = "h-8 border px-3 font-mono text-[0.6rem] uppercase tracking-[0.14em] transition-colors disabled:opacity-40";
const tones = {
  ok: "border-success/40 text-success hover:bg-success/10",
  warn: "border-warning/40 text-warning hover:bg-warning/10",
  danger: "border-danger/40 text-danger hover:bg-danger/10",
  neutral: "border-line-strong text-white hover:border-white",
};

function useRun() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      toast(r.message ?? (r.ok ? "Done." : "Failed."), r.ok ? "success" : "error");
      if (r.ok) router.refresh();
    });
  return { pending, run };
}

function ask(label: string, required = true): string | null {
  const v = window.prompt(label);
  if (v === null) return null;
  if (required && !v.trim()) return null;
  return v;
}

export function ListingModeration({ id, status, featured, hasEvidence }: { id: string; status: string; featured: boolean; hasEvidence: boolean }) {
  const { pending, run } = useRun();
  const act = (d: ListingDecision, prompt?: string) => {
    const note = prompt ? ask(prompt) : undefined;
    if (prompt && note === null) return;
    run(() => moderateListing(id, d, note ?? undefined));
  };
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      {["pending_review", "rejected", "suspended"].includes(status) && status !== "suspended" && (
        <button type="button" disabled={pending} className={cn(btn, tones.ok)} onClick={() => act("approve")}>Approve</button>
      )}
      {status === "pending_review" && (
        <button type="button" disabled={pending} className={cn(btn, tones.warn)} onClick={() => act("reject", "What does the seller need to change? (shown to the seller)")}>Request changes</button>
      )}
      {status !== "suspended" ? (
        <button type="button" disabled={pending} className={cn(btn, tones.danger)} onClick={() => act("suspend", "Reason for suspension (shown to the seller):")}>Suspend</button>
      ) : (
        <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => act("reinstate")}>Reinstate</button>
      )}
      {status === "active" && (
        <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => act(featured ? "unfeature" : "feature")}>{featured ? "Unfeature" : "Feature"}</button>
      )}
      <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => act("inspected", "Inspection evidence: provider, date and report reference")}>Record inspection</button>
      <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => act("history_checked", "History check evidence: provider and reference")}>Record history check</button>
      {hasEvidence && <button type="button" disabled={pending} className={cn(btn, tones.danger)} onClick={() => act("clear_evidence")}>Clear evidence</button>}
    </div>
  );
}

export function ReportControls({ id, status }: { id: string; status: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      {status === "open" && <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => run(() => resolveReport(id, "reviewing"))}>Start review</button>}
      {status !== "resolved" && <button type="button" disabled={pending} className={cn(btn, tones.ok)} onClick={() => { const n = ask("Resolution note (internal):", false); if (n !== null) run(() => resolveReport(id, "resolved", n)); }}>Resolve</button>}
      {status !== "dismissed" && <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => { const n = ask("Why is this report being dismissed?", false); if (n !== null) run(() => resolveReport(id, "dismissed", n)); }}>Dismiss</button>}
    </div>
  );
}

export function AccountControls({ id, status, identityVerified }: { id: string; status: string; identityVerified: boolean }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      {status === "active" ? (
        <button type="button" disabled={pending} className={cn(btn, tones.danger)} onClick={() => { const r = ask("Reason for suspending this account:"); if (r) run(() => setAccountStatus(id, "suspended", r)); }}>Suspend account</button>
      ) : (
        <button type="button" disabled={pending} className={cn(btn, tones.ok)} onClick={() => run(() => setAccountStatus(id, "active"))}>Reinstate</button>
      )}
      {identityVerified && <button type="button" disabled={pending} className={cn(btn, tones.warn)} onClick={() => { const r = ask("Reason for revoking identity verification:"); if (r) run(() => revokeIdentityVerification(id, r)); }}>Revoke ID badge</button>}
    </div>
  );
}

export function VerificationControls({ id }: { id: string }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      <button type="button" disabled={pending} className={cn(btn, tones.ok)} onClick={() => { const n = ask("Evidence reviewed (internal note, e.g. registry checked):"); if (n) run(() => reviewVerification(id, "approved", n)); }}>Approve</button>
      <button type="button" disabled={pending} className={cn(btn, tones.danger)} onClick={() => { const n = ask("Reason (shown to the applicant):"); if (n) run(() => reviewVerification(id, "rejected", n)); }}>Decline</button>
    </div>
  );
}

export function ModerationModeToggle({ mode }: { mode: "required" | "auto" }) {
  const { pending, run } = useRun();
  const [current, setCurrent] = useState(mode);
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Listing moderation mode">
      {(["required", "auto"] as const).map((m) => (
        <button
          key={m}
          type="button"
          disabled={pending || current === m}
          aria-pressed={current === m}
          onClick={() => run(async () => { const r = await setModerationMode(m); if (r.ok) setCurrent(m); return r; })}
          className={cn(btn, current === m ? "border-white bg-white text-obsidian" : tones.neutral)}
        >
          {m === "required" ? "Review required" : "Auto-publish"}
        </button>
      ))}
    </div>
  );
}

export function ContactHandled({ id }: { id: string }) {
  const { pending, run } = useRun();
  return <button type="button" disabled={pending} className={cn(btn, tones.neutral)} onClick={() => run(() => markContactHandled(id))}>Mark handled</button>;
}
