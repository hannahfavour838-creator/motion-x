import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Trust, verification & review", description: "Exactly what MOTION X checks — and what it does not.", alternates: { canonical: "/trust" } };

export default function TrustPage() {
  return (
    <ProsePage eyebrow="Trust" title="Verification & review" intro="Trust depends on precise language. Each badge on MOTION X means one specific thing, and is only shown when that check has actually been completed.">
      <section>
        <h2>The badges, defined</h2>
        <dl className="space-y-6">
          <div><dt className="mb-2"><Badge tone="outline">Registered seller</Badge></dt><dd>The seller has a MOTION X account with a confirmed email address. No identity or business checks are implied.</dd></div>
          <div><dt className="mb-2"><Badge tone="electric">Identity verified</Badge></dt><dd>A MOTION X administrator reviewed the seller&apos;s identity details and approved the request. It confirms who the seller is — not who owns a vehicle, and not a vehicle&apos;s condition.</dd></div>
          <div><dt className="mb-2"><Badge tone="electric">Business verified</Badge></dt><dd>A MOTION X administrator checked the dealership&apos;s registered business details (for example, against a public companies registry) and approved the request.</dd></div>
          <div><dt className="mb-2"><Badge tone="success">Inspection report on file</Badge></dt><dd>An independent inspection report for this specific vehicle has been provided and recorded by an administrator. MOTION X does not perform inspections and does not guarantee the findings.</dd></div>
          <div><dt className="mb-2"><Badge tone="success">History check on file</Badge></dt><dd>A vehicle-history check from a third-party provider has been provided and recorded by an administrator.</dd></div>
        </dl>
      </section>
      <section>
        <h2>Listing review</h2>
        <p>New listings are reviewed before they appear publicly. When a live listing&apos;s key details change (make, model, year, body style, condition or description), it returns to review. Price and specification updates go live immediately. Review checks that a listing is complete and plausible; it is not an inspection of the vehicle.</p>
      </section>
      <section>
        <h2>Reports & suspensions</h2>
        <p>Every listing can be reported. Reports are reviewed by the MOTION X team; listings or accounts that breach our <Link href="/terms">terms</Link> can be suspended, which hides them immediately. Duplicate listings by the same seller are flagged to reviewers.</p>
      </section>
      <section>
        <h2>Staying safe as a buyer</h2>
        <ul>
          <li>See the vehicle — or have it independently inspected — before paying anything.</li>
          <li>Never send deposits by untraceable methods or to someone you cannot verify.</li>
          <li>Check ownership documents and the vehicle identification number match.</li>
          <li>For cross-border purchases, confirm duties, taxes, transport and compliance rules for your country first.</li>
        </ul>
        <p>MOTION X does not process payments and is not party to the sale.</p>
      </section>
    </ProsePage>
  );
}
