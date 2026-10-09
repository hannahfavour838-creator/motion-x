import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "Terms of service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Terms" title="Terms of service">
      <FormMessage tone="info">Draft for legal review. Add your legal entity, governing law and dispute-resolution terms, and have this reviewed by a qualified lawyer in each market you operate in before launch.</FormMessage>
      <section>
        <h2>The service</h2>
        <p>MOTION X is a platform where sellers advertise vehicles and buyers contact sellers. MOTION X is not a party to any sale, does not take payments, and does not own, inspect or guarantee any vehicle.</p>
      </section>
      <section>
        <h2>Seller obligations</h2>
        <ul>
          <li>Only list vehicles you are entitled to sell, with accurate details and genuine photographs of that vehicle.</li>
          <li>Disclose known faults and the correct mileage. Keep availability up to date and mark vehicles as sold.</li>
          <li>Comply with consumer-protection, advertising and vehicle-sale laws in your country.</li>
          <li>Use buyer contact details only to respond to their enquiry.</li>
        </ul>
      </section>
      <section>
        <h2>Prohibited content</h2>
        <p>Fraudulent, misleading, duplicate, stolen-vehicle or offensive listings; requests for payment outside a verified transaction; and any attempt to circumvent moderation, rate limits or security controls.</p>
      </section>
      <section>
        <h2>Moderation</h2>
        <p>We may review, reject, suspend or remove listings and accounts that breach these terms, and keep a record of moderation actions.</p>
      </section>
      <section>
        <h2>Buyers</h2>
        <p>Verify the seller, the vehicle and its documents before paying. Taxes, import duties, registration, transport and compliance requirements vary by destination and are the buyer&apos;s responsibility to confirm.</p>
      </section>
    </ProsePage>
  );
}
