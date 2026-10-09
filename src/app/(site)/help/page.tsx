import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Help centre", alternates: { canonical: "/help" } };

const groups: [string, [string, React.ReactNode][]][] = [
  ["Buying", [
    ["Do I need an account?", "No. You can browse, search and contact sellers without registering. An account lets you save vehicles and keep your enquiries in one place."],
    ["Why are prices in different currencies?", "Each seller sets their asking price in their own currency, and we always show it unchanged. If converted estimates are enabled, they are labelled as estimates."],
    ["How do I compare vehicles?", <>Use the compare icon on any vehicle card (up to four), then open <Link href="/compare">Compare</Link>.</>],
    ["Can I have a vehicle inspected?", "Where the seller allows it, use “Request inspection” on the listing to arrange an independent inspection directly with the seller."],
  ]],
  ["Selling", [
    ["How long does review take?", "Listings are reviewed by our team. You'll see the status in your dashboard and any requested changes with a note."],
    ["How many photos can I upload?", "Up to 24 per listing — JPEG, PNG, WebP or AVIF, up to 10 MB each."],
    ["How do I mark a vehicle as sold?", "Open your dashboard, find the listing and choose “Mark sold”."],
  ]],
  ["Account & safety", [
    ["I forgot my password", <><Link href="/forgot-password">Reset it here</Link>.</>],
    ["How do I report a listing?", "Use “Report listing” at the bottom of the vehicle's details. Reports are confidential."],
    ["What does verified mean?", <>See <Link href="/trust">verification &amp; review</Link>.</>],
  ]],
];

export default function HelpPage() {
  return (
    <ProsePage eyebrow="Help" title="Help centre" intro={<>Answers to common questions. Can&apos;t find what you need? <Link href="/contact">Contact us</Link>.</>}>
      {groups.map(([title, items]) => (
        <section key={title}>
          <h2>{title}</h2>
          <dl className="divide-y divide-line border-y border-line">
            {items.map(([q, a]) => (
              <div key={q} className="py-5"><dt className="text-silver">{q}</dt><dd className="mt-2">{a}</dd></div>
            ))}
          </dl>
        </section>
      ))}
    </ProsePage>
  );
}
