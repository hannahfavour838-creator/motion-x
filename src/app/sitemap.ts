import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { COLLECTIONS, collectionHref } from "@/config/vehicles";
import { isSupabaseConfigured } from "@/lib/env";
import { listShowroomAssets } from "@/lib/data/assets";
import { listDealers } from "@/lib/data/dealers";
import { createPublicClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => `${siteConfig.url}${p}`;
  const staticRoutes = ["/", "/cars", "/collections", "/showroom", "/sell", "/dealers", "/dealers/directory", "/trust", "/about", "/help", "/contact", "/privacy", "/terms", "/credits"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((p) => ({ url: u(p), changeFrequency: p === "/" || p === "/cars" ? "daily" : "monthly", priority: p === "/" ? 1 : 0.6 }));
  entries.push(...COLLECTIONS.map((c) => ({ url: u(collectionHref(c)), changeFrequency: "daily" as const, priority: 0.7 })));
  const assets = await listShowroomAssets().catch(() => []);
  entries.push(...assets.map((a) => ({ url: u(`/showroom/${a.slug}`), changeFrequency: "monthly" as const, priority: 0.5 })));

  // Only genuine, public listings and dealers are submitted to search engines.
  if (isSupabaseConfigured()) {
    const { data } = await createPublicClient().from("vehicles").select("slug, updated_at").in("status", ["active", "sold"]).eq("is_demo", false).limit(45000);
    entries.push(...(data ?? []).map((v) => ({ url: u(`/cars/${v.slug}`), lastModified: v.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })));
    const dealers = await listDealers({ includeDemo: false, limit: 5000 }).catch(() => []);
    entries.push(...dealers.map((d) => ({ url: u(`/dealers/${d.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })));
  }
  return entries;
}
