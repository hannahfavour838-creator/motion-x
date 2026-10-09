import { Hero } from "@/components/home/hero";
import { HeroPoster } from "@/components/home/hero-poster";
import {
  CollectionsSection, DealersSection, DiscoverySection, FeaturedSection, FinalCta, SellersSection, ShowroomSection, TrustSection,
} from "@/components/home/sections";
import { listDealers } from "@/lib/data/dealers";
import { getFeaturedVehicles, getMakeSuggestions, getVehicleCountsByCountry } from "@/lib/data/vehicles";
import { siteConfig } from "@/config/site";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, makes, marketCounts, dealers] = await Promise.all([
    getFeaturedVehicles(6).catch(() => []),
    getMakeSuggestions().catch(() => []),
    getVehicleCountsByCountry().catch(() => ({})),
    listDealers({ includeDemo: false, limit: 6 }).catch(() => []),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MOTION X",
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/cars?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero poster={<HeroPoster />} />
      <DiscoverySection makes={makes} marketCounts={marketCounts} />
      <CollectionsSection />
      <FeaturedSection vehicles={featured} />
      <ShowroomSection />
      <DealersSection dealers={dealers} />
      <SellersSection />
      <TrustSection />
      <FinalCta />
    </>
  );
}
