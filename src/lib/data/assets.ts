import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import type { Vehicle3DAsset } from "@/lib/types";
import { mapAsset } from "./mappers";

/**
 * The licensed concept-car asset ships with the app so the showroom works
 * before a database is connected. It mirrors the row inserted by the
 * `20261009000200_showroom_assets.sql` migration.
 */
export const BUILTIN_ASSETS: Vehicle3DAsset[] = [
  {
    id: "builtin-concept-car",
    slug: "concept-car",
    name: "Silver Concept Car",
    format: "glb",
    url: "/models/concept-car.glb",
    posterUrl: "/renders/hero-fallback.webp",
    fileBytes: 3356056,
    credit: "“Car Concept” by Eric Chadwick / Darmstadt Graphics Group GmbH (2024), based on a CC0 model by Unity Fan. Modified.",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    description: "A low, wide electric concept coupé used as the MOTION X studio car. It is a showcase model and is not offered for sale.",
    paintOptions: [
      { id: "liquid-silver", name: "Liquid Silver", color: "#c9ced6", metalness: 1, roughness: 0.18, clearcoat: 1 },
      { id: "obsidian", name: "Obsidian", color: "#0d0f13", metalness: 0.9, roughness: 0.25, clearcoat: 1 },
      { id: "carmine", name: "Carmine Candy", color: "#8f0a0a", metalness: 1, roughness: 0.22, clearcoat: 1 },
      { id: "pearl", name: "Pearl", color: "#e9e6df", metalness: 0.6, roughness: 0.3, clearcoat: 1 },
      { id: "graphite", name: "Torched Graphite", color: "#2a2d33", metalness: 1, roughness: 0.3, clearcoat: 1 },
    ],
  },
];

export async function listShowroomAssets(): Promise<Vehicle3DAsset[]> {
  if (!isSupabaseConfigured()) return BUILTIN_ASSETS;
  const { data, error } = await createPublicClient().from("vehicle_3d_assets").select("*").eq("is_published", true).order("created_at");
  if (error || !data?.length) return BUILTIN_ASSETS;
  return data.map(mapAsset);
}

export async function getShowroomAsset(slug: string): Promise<Vehicle3DAsset | null> {
  const all = await listShowroomAssets();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function getAssetById(id: string | null): Promise<Vehicle3DAsset | null> {
  if (!id) return null;
  const all = await listShowroomAssets();
  return all.find((a) => a.id === id) ?? null;
}
