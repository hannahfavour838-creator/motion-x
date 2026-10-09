import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { CookiePreferences } from "@/components/forms/cookie-preferences";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Cookie preferences", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <ProsePage eyebrow="Cookies" title="Cookie preferences">
      <section>
        <h2>Essential</h2>
        <p>Authentication cookies keep you signed in securely. They are required for accounts to work and cannot be switched off. Your comparison list and display-currency choice are stored in your browser&apos;s local storage, not in cookies.</p>
      </section>
      <section>
        <h2>Analytics</h2>
        {publicEnv.plausibleDomain ? (
          <>
            <p>We use privacy-friendly, cookieless analytics to count page views and key actions (searches, listing views, enquiries submitted). No personal data is collected. You can opt out on this device:</p>
            <CookiePreferences />
          </>
        ) : (
          <p>No analytics are enabled on this deployment.</p>
        )}
      </section>
    </ProsePage>
  );
}
