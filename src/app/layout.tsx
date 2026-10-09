import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/components/providers/app-providers";
import { AnalyticsLoader } from "@/components/providers/analytics-loader";
import { siteConfig } from "@/config/site";
import { DISPLAY_CURRENCIES } from "@/config/markets";
import { publicEnv } from "@/lib/env";
import { getExchangeRates } from "@/lib/rates";
import "./globals.css";

const archivo = localFont({
  src: "../fonts/archivo-wdth.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MOTION X — The World Is Your Showroom",
    template: "%s · MOTION X",
  },
  description: siteConfig.description,
  applicationName: "MOTION X",
  openGraph: {
    type: "website",
    siteName: "MOTION X",
    title: "MOTION X — The World Is Your Showroom",
    description: siteConfig.description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Rates are cached (12 h provider cache / 1 h database cache), so this keeps
// the shell static while still allowing estimated conversions.
export const revalidate = 3600;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const ratesInfo = await getExchangeRates();
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${archivo.variable} antialiased`}>
      <body className="min-h-dvh bg-obsidian">
        <a href="#main" className="sr-only z-[100] bg-white px-4 py-3 text-obsidian focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <AppProviders rates={ratesInfo?.rates ?? null} rateAttribution={ratesInfo?.attribution ?? null} displayCurrencies={DISPLAY_CURRENCIES}>
          {children}
        </AppProviders>
        {publicEnv.plausibleDomain && <AnalyticsLoader domain={publicEnv.plausibleDomain} src={publicEnv.plausibleSrc} />}
      </body>
    </html>
  );
}
