import Link from "next/link";
import type { EnquiryRow } from "@/lib/data/account";
import { cn, formatDate } from "@/lib/format";
import { ReplyForm } from "./enquiry-components";
import { StatusBadge } from "./status-badge";

const when = (iso: string) => formatDate(iso, "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function EnquiryThread({
  enquiry, messages, viewerId, role,
}: {
  enquiry: EnquiryRow; messages: { id: string; sender_id: string; body: string; created_at: string }[]; viewerId: string; role: "seller" | "buyer";
}) {
  const canReply = enquiry.status !== "spam" && (role === "seller" || enquiry.buyer_id === viewerId);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
        <div className="bg-obsidian py-3 pr-4">
          <p className="eyebrow">Vehicle</p>
          {enquiry.vehicle ? (
            <Link href={`/cars/${enquiry.vehicle.slug}`} className="mt-1 block text-sm text-white hover:text-electric">{enquiry.vehicle.year} {enquiry.vehicle.make} {enquiry.vehicle.model}</Link>
          ) : <p className="mt-1 text-sm text-muted">Listing removed</p>}
        </div>
        <div className="bg-obsidian py-3 pr-4">
          <p className="eyebrow">Status</p>
          <div className="mt-1.5"><StatusBadge status={enquiry.status} /></div>
        </div>
        <div className="bg-obsidian py-3 pr-4">
          <p className="eyebrow">Received</p>
          <p className="mt-1 text-sm text-silver">{when(enquiry.created_at)}</p>
        </div>
      </div>

      {role === "seller" && (
        <div className="border border-line bg-ink p-5 text-sm">
          <p className="eyebrow mb-3">Buyer contact details</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="text-xs text-dim">Name</dt><dd className="text-white">{enquiry.name}</dd></div>
            <div><dt className="text-xs text-dim">Email</dt><dd><a className="text-white underline underline-offset-2" href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd></div>
            {enquiry.phone && <div><dt className="text-xs text-dim">Phone</dt><dd><a className="text-white" href={`tel:${enquiry.phone}`}>{enquiry.phone}</a></dd></div>}
            <div><dt className="text-xs text-dim">Prefers</dt><dd className="capitalize text-white">{enquiry.preferred_contact}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-dim">Use these details only to respond about this vehicle.{!enquiry.buyer_id && " This buyer does not have a MOTION X account, so reply directly by email or phone."}</p>
        </div>
      )}

      <ol className="space-y-4" aria-label="Conversation">
        <li className="max-w-2xl border border-line bg-ink p-5">
          <p className="text-xs text-muted">{role === "seller" ? enquiry.name : "You"} · {when(enquiry.created_at)}</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-silver">{enquiry.message}</p>
        </li>
        {messages.map((m) => {
          const mine = m.sender_id === viewerId;
          return (
            <li key={m.id} className={cn("max-w-2xl border p-5", mine ? "ml-auto border-electric/30 bg-electric/[0.05]" : "border-line bg-ink")}>
              <p className="text-xs text-muted">{mine ? "You" : m.sender_id === enquiry.seller_id ? "Seller" : enquiry.name} · {when(m.created_at)}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-silver">{m.body}</p>
            </li>
          );
        })}
      </ol>

      {canReply && (role === "seller" ? Boolean(enquiry.buyer_id) : true) ? (
        <ReplyForm enquiryId={enquiry.id} />
      ) : null}
    </div>
  );
}
