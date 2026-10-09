// Generates the render job list: `npx tsx tools/studio-renderer/jobs.ts > /tmp/jobs.json`
import { DEMO_VEHICLES } from "../../src/lib/demo/inventory";

const jobs: { out: string; params: Record<string, unknown>; quality?: number }[] = [];

for (const v of DEMO_VEHICLES) {
  const base = `public/renders/demo/${v.id.slice(-4)}`;
  const vehicle = { ...v.render, caliper: v.render.caliper };
  jobs.push({ out: `${base}-a.webp`, params: { vehicle, view: "front34", w: 1440, h: 960, fov: 19.5, camera: [6.6, 1.1, 7.4, 0.15, 0.6, 0] }, quality: 78 });
  jobs.push({ out: `${base}-b.webp`, params: { vehicle, view: "rear34", w: 1440, h: 960, fov: 19.5, camera: [-6.4, 1.35, 7.2, -0.15, 0.64, 0] }, quality: 78 });
}

const collections: Record<string, Record<string, unknown>> = {
  supercars: { vehicle: { preset: "supercar", color: "#c6cbd3", caliper: "#5c8dff" }, camera: [6.2, 0.55, 5.4, 0, 0.5, 0] },
  luxury: { vehicle: { preset: "sedan", color: "#121316", rimColor: "#c8ccd2" }, camera: [6.4, 0.9, 6.8, 0, 0.7, 0] },
  performance: { vehicle: { preset: "gt", color: "#8d939b", rimColor: "#22252a" }, camera: [-6.0, 0.8, 6.4, 0, 0.6, 0] },
  suvs: { vehicle: { preset: "suv", color: "#e9e9e5", blackRoof: true, rimColor: "#22252a" }, camera: [6.8, 1.1, 7.2, 0, 0.85, 0] },
  electric: { vehicle: { preset: "sedan", color: "#dfe3ea", blackRoof: true, caliper: "#5c8dff" }, camera: [6.6, 0.9, 6.6, 0, 0.65, 0], blueKick: 2.4 },
  everyday: { vehicle: { preset: "hatch", color: "#a7acb2" }, camera: [6.0, 1.0, 6.2, 0, 0.65, 0] },
  classics: { vehicle: { preset: "classic", color: "#1d3b2a" }, camera: [6.0, 0.8, 6.0, 0, 0.55, 0] },
};
for (const [slug, params] of Object.entries(collections)) {
  jobs.push({ out: `public/renders/collection-${slug}.webp`, params: { ...params, w: 1600, h: 1100 }, quality: 80 });
}

// Hero fallback stills of the licensed concept car (desktop & mobile framings).
jobs.push({ out: "public/renders/hero-fallback.webp", params: { glb: "/public/models/concept-car.glb", w: 2400, h: 1350, camera: [6.4, 1.05, 7.6, 0.6, 0.55, 0], fov: 24 }, quality: 82 });
jobs.push({ out: "public/renders/hero-fallback-mobile.webp", params: { glb: "/public/models/concept-car.glb", w: 1080, h: 1500, camera: [7.4, 1.6, 9.4, 0, 0.4, 0], fov: 30 }, quality: 80 });
jobs.push({ out: "public/renders/showroom-side.webp", params: { glb: "/public/models/concept-car.glb", w: 2000, h: 1100, camera: [0.4, 1.0, 10.5, 0, 0.6, 0], fov: 24 }, quality: 80 });

process.stdout.write(JSON.stringify(jobs, null, 1));
