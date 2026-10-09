import { Badge } from "@/components/ui/misc";
import type { SellerSummary, Vehicle } from "@/lib/types";

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>
);

/**
 * Seller status. These are distinct claims and are only shown when the
 * corresponding verification has actually been completed:
 *  - Registered seller — has an account (no checks implied)
 *  - Identity verified — an administrator reviewed identity documents
 *  - Business verified — an administrator reviewed business registration
 */
export function SellerBadges({ seller, size = "md" }: { seller: SellerSummary; size?: "sm" | "md" }) {
  if (seller.isDemo) {
    return <Badge tone="warning">Demonstration seller</Badge>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {seller.businessVerified && <Badge tone="electric" icon={<Check />}>Business verified</Badge>}
      {seller.identityVerified && <Badge tone="electric" icon={<Check />}>Identity verified</Badge>}
      {!seller.businessVerified && !seller.identityVerified && (
        <Badge tone="outline">{size === "sm" ? "Registered" : seller.type === "dealer" ? "Registered dealer" : "Registered seller"}</Badge>
      )}
    </span>
  );
}

/** Vehicle-level evidence badges — only shown when recorded by an administrator. */
export function VehicleEvidenceBadges({ vehicle }: { vehicle: Pick<Vehicle, "inspectedAt" | "historyCheckedAt"> }) {
  if (!vehicle.inspectedAt && !vehicle.historyCheckedAt) return null;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {vehicle.inspectedAt && <Badge tone="success" icon={<Check />}>Inspection report on file</Badge>}
      {vehicle.historyCheckedAt && <Badge tone="success" icon={<Check />}>History check on file</Badge>}
    </span>
  );
}
