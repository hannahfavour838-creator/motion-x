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

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The marketplace is session-aware on most routes; we use the classic
  // caching model with explicit revalidation instead of Cache Components.
  cacheComponents: false,
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
