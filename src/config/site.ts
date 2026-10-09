/**
 * Site-wide configuration. Everything that differs per deployment comes from
 * environment variables — nothing country-specific is hardcoded here.
 */

/**
 * Canonical origin used for metadata, sitemaps and auth-email links.
 * NEXT_PUBLIC_SITE_URL should always be set in production; on Vercel the
 * project's production domain (a system variable) is the fallback, so links
 * never point at localhost in a deployed build.
 */
function resolveSiteUrl(): string {
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export const siteConfig = {
  name: "MOTION X",
  tagline: "The world is your showroom.",
  description:
    "MOTION X is a global automotive discovery platform connecting buyers, private sellers and professional dealerships across international markets — with immersive 3D showrooms.",
  url: resolveSiteUrl(),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "",
    x: process.env.NEXT_PUBLIC_SOCIAL_X || "",
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "",
  },
} as const;

export const mainNav = [
  { href: "/cars", label: "Discover" },
  { href: "/collections", label: "Collections" },
  { href: "/showroom", label: "3D Showroom" },
  { href: "/dealers", label: "For Dealers" },
] as const;

export const PAGE_SIZE = 24;

export const uploadLimits = {
  maxImageBytes: 10 * 1024 * 1024,
  maxImagesPerListing: 24,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"] as const,
  maxLogoBytes: 2 * 1024 * 1024,
};
