"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteListing, setListingStatus } from "@/app/actions/seller";
import { useToast } from "@/components/ui/toast";
import type { ListingStatus } from "@/config/vehicles";
import { cn } from "@/lib/format";

type Intent = "submit" | "withdraw" | "pause" | "resume" | "sold" | "relist";

const available: Record<ListingStatus, { intent: Intent | "delete"; label: string }[]> = {
  draft: [{ intent: "submit", label: "Submit for review" }, { intent: "delete", label: "Delete" }],
  rejected: [{ intent: "submit", label: "Resubmit" }, { intent: "delete", label: "Delete" }],
  pending_review: [{ intent: "withdraw", label: "Withdraw" }, { intent: "delete", label: "Delete" }],
  active: [{ intent: "pause", label: "Pause" }, { intent: "sold", label: "Mark sold" }],
  paused: [{ intent: "resume", label: "Resume" }, { intent: "sold", label: "Mark sold" }],
  sold: [{ intent: "relist", label: "Relist" }],
  suspended: [],
};

export function ListingActions({ id, status, compact = false }: { id: string; status: ListingStatus; compact?: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (intent: Intent | "delete") => {
    if (intent === "delete" && !window.confirm("Delete this listing permanently? This cannot be undone.")) return;
    if (intent === "sold" && !window.confirm("Mark this vehicle as sold? Buyers will no longer be able to enquire.")) return;
    start(async () => {
      const r = intent === "delete" ? await deleteListing(id) : await setListingStatus(id, intent);
      toast(r.message ?? (r.ok ? "Updated." : "Something went wrong."), r.ok ? "success" : "error");
      if (r.ok) {
        if (intent === "delete") router.push("/dashboard/listings");
        router.refresh();
      }
    });
  };
  const actions = available[status];
  if (!actions.length) return <span className="text-xs text-dim">Contact support</span>;
  return (
    <div className={cn("flex flex-wrap gap-2", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
      {actions.map((a) => (
        <button
          key={a.intent}
          type="button"
          onClick={() => run(a.intent)}
          className={cn(
            "border px-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors",
            compact ? "h-8" : "h-10 px-4",
            a.intent === "delete" ? "border-danger/40 text-danger hover:bg-danger/10" : "border-line-strong text-white hover:border-white",
          )}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
