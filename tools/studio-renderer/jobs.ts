// Generates the render job list: `npx tsx tools/studio-renderer/jobs.ts > /tmp/jobs.json`
//
// Demo listings and collection banners now use licensed photographs
// (tools/photos); the studio renderer only produces stills of the licensed
// 3D concept car used by the hero and showroom fallbacks.

const jobs: { out: string; params: Record<string, unknown>; quality?: number }[] = [];

// Hero fallback stills of the licensed concept car (desktop & mobile framings).
jobs.push({ out: "public/renders/hero-fallback.webp", params: { glb: "/public/models/concept-car.glb", w: 2400, h: 1350, camera: [6.4, 1.05, 7.6, 0.6, 0.55, 0], fov: 24 }, quality: 82 });
jobs.push({ out: "public/renders/hero-fallback-mobile.webp", params: { glb: "/public/models/concept-car.glb", w: 1080, h: 1500, camera: [7.4, 1.6, 9.4, 0, 0.4, 0], fov: 30 }, quality: 80 });
jobs.push({ out: "public/renders/showroom-side.webp", params: { glb: "/public/models/concept-car.glb", w: 2000, h: 1100, camera: [0.4, 1.0, 10.5, 0, 0.6, 0], fov: 24 }, quality: 80 });

process.stdout.write(JSON.stringify(jobs, null, 1));
