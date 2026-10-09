import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "About", description: "MOTION X is a global automotive discovery platform.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <ProsePage eyebrow="About" title="About MOTION X" intro="MOTION X is a global automotive discovery platform connecting buyers, private sellers and professional dealerships across international markets.">
      <section>
        <h2>What we&apos;re building</h2>
        <p>Buying a car is one of the most considered purchases people make, yet discovering vehicles across borders is fragmented and opaque. MOTION X brings listings from many markets into one place, keeps every price in the seller&apos;s own currency, and adds immersive 3D showrooms where licensed models are available.</p>
      </section>
      <section>
        <h2>How we work</h2>
        <ul>
          <li>Listings are reviewed before they go live.</li>
          <li>Verification badges are specific and earned — see <Link href="/trust">how verification works</Link>.</li>
          <li>We don&apos;t invent statistics, reviews or inventory. Demonstration listings are always labelled.</li>
          <li>We are independent and not affiliated with or endorsed by any vehicle manufacturer.</li>
        </ul>
      </section>
      <section>
        <h2>Get involved</h2>
        <p><Link href="/sell">Sell a vehicle</Link>, <Link href="/dealers">bring your dealership</Link> or <Link href="/contact">get in touch</Link>.</p>
      </section>
    </ProsePage>
  );
}
