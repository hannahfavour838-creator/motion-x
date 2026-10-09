import { Badge } from "@/components/ui/misc";
import { LABELS, type ListingStatus } from "@/config/vehicles";

const TONES: Record<ListingStatus, "neutral" | "electric" | "success" | "warning" | "danger" | "outline"> = {
  draft: "outline",
  pending_review: "warning",
  active: "success",
  paused: "neutral",
  sold: "electric",
  rejected: "danger",
  suspended: "danger",
};

/** Status is conveyed by text as well as colour. */
export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <Badge tone={TONES[status]}>{LABELS.status[status]}</Badge>;
}

const GENERIC: Record<string, "neutral" | "electric" | "success" | "warning" | "danger" | "outline"> = {
  new: "electric", read: "outline", replied: "success", closed: "neutral", spam: "danger",
  requested: "electric", acknowledged: "outline", scheduled: "warning", completed: "success", declined: "neutral", cancelled: "neutral",
  open: "danger", reviewing: "warning", resolved: "success", dismissed: "neutral",
  pending: "warning", approved: "success", rejected: "danger",
  active: "success", suspended: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={GENERIC[status] ?? "outline"}>{status.replace(/_/g, " ")}</Badge>;
}
