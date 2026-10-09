import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { FormMessage } from "@/components/ui/form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Privacy" title="Privacy policy" intro="This policy describes the personal data MOTION X processes as implemented in this application.">
      <FormMessage tone="info">Draft for legal review. Requirements differ by country (e.g. GDPR, UK GDPR, CCPA/CPRA, NDPR). Have this policy reviewed by a qualified lawyer and add your legal entity and contact details before launch.</FormMessage>
      <section>
        <h2>Data we collect</h2>
        <ul>
          <li><strong>Account data</strong>: email address, password (stored as a hash by our authentication provider), display name, account type, optional country, city and phone number.</li>
          <li><strong>Seller data</strong>: listing details and photographs you upload; for dealerships, the business details you choose to publish.</li>
          <li><strong>Enquiries</strong>: the name, contact details and message you send to a seller.</li>
          <li><strong>Verification requests</strong>: the details you submit for identity or business verification.</li>
          <li><strong>Usage data</strong>: aggregated listing view counts. If privacy-friendly analytics are enabled, anonymous page views and events without cookies or personal data.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>To operate your account, publish listings, deliver enquiries to sellers, review listings and verification requests, prevent abuse (including rate limiting using a one-way hash of your IP address), and show sellers aggregate performance of their listings.</p>
      </section>
      <section>
        <h2>Who can see it</h2>
        <p>Your email and phone are never published. When you send an enquiry, the seller receives your name, contact details and message. Sellers can see how many times a listing was viewed or saved, but not who saved it. Administrators can access data where needed to moderate the platform.</p>
      </section>
      <section>
        <h2>Processors</h2>
        <p>Data is stored with Supabase (database, authentication and file storage) and the site is hosted on Vercel. Exchange-rate and analytics providers, when enabled, receive no personal data.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>You can update your profile in <Link href="/account/settings">account settings</Link>. To access, export or delete your data, <Link href="/contact?topic=trust">contact us</Link>{siteConfig.contactEmail ? <> or email {siteConfig.contactEmail}</> : null}.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>We use essential cookies to keep you signed in. See <Link href="/cookies">cookie preferences</Link>.</p>
      </section>
    </ProsePage>
  );
}
