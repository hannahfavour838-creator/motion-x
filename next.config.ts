import type { NextConfig } from "next";

/**
 * Remote image hosts are derived from configuration rather than hardcoded,
 * so seller photos served from Supabase Storage work in every environment.
 */
function remoteImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const { hostname, protocol } = new URL(supabaseUrl);
      patterns.push({
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      });
    } catch {
      // Invalid URL – ignored; the configuration check surfaces it at runtime.
    }
  }
  return patterns;
}

/**
 * Production builds warn (rather than fail) about missing configuration so a
 * preview deployment still works, but nothing ships silently misconfigured.
 */
function warnAboutProductionConfig() {
  const isProdBuild = process.env.NODE_ENV === "production" && (process.env.VERCEL_ENV ?? "production") === "production";
  if (!isProdBuild) return;
  const warnings: string[] = [];
  if (!process.env.NEXT_PUBLIC_SITE_URL) warnings.push("NEXT_PUBLIC_SITE_URL is not set — canonical URLs and auth-email links use a fallback origin.");
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasUrl !== hasKey) warnings.push("Only one of NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set — accounts stay disabled.");
  if (!hasUrl && !hasKey) warnings.push("Supabase is not configured — the site runs in preview mode (demonstration inventory, no accounts).");
  if ((hasUrl || hasKey) && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) warnings.push("SUPABASE_SERVICE_ROLE_KEY is not set — listing view statistics and exchange-rate refresh are disabled.");
  if (!process.env.RATE_LIMIT_SALT) warnings.push("RATE_LIMIT_SALT is not set — visitor IP hashes use a public default salt.");
  for (const w of warnings) console.warn(`⚠ MOTION X config: ${w}`);
}
warnAboutProductionConfig();

/**
 * Conservative CSP: blocks plugins, <base> hijacking, cross-site form posts and
 * framing. Scripts/styles are not restricted here — a nonce-based script policy
 * should be added and tested together with analytics before tightening further.
 */
const contentSecurityPolicy = ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'"].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The marketplace is session-aware on most routes; we use the classic
  // caching model with explicit revalidation instead of Cache Components.
  cacheComponents: false,
  // Only overridden by tools/qa/build-live-config.mjs so its test build never
  // replaces the normal .next output.
  ...(process.env.MX_DIST_DIR ? { distDir: process.env.MX_DIST_DIR } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: remoteImagePatterns(),
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
