// Turns the cached Commons photos into site assets:
//   public/photos/demo/NNNN.webp       1600×1067 (3:2) listing photos
//   public/photos/banners/<slug>.webp  2000×1125 (16:9) collection banners
//   src/lib/demo/photos.generated.json credits + dimensions read by the app
// Run `node tools/photos/fetch.mjs` first (or `npm run photos`).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { BANNERS, VEHICLE_PHOTOS } from "./manifest.mjs";

const ROOT = join(import.meta.dirname, "..", "..");
const CACHE = join(ROOT, ".photo-cache");
const meta = JSON.parse(readFileSync(join(CACHE, "meta.json"), "utf8"));

/** Blur each plate rectangle (fractions of the source) in place. */
async function blurPlates(input, rects = []) {
  const img = sharp(input);
  const { width: W, height: H } = await img.metadata();
  const layers = [];
  for (const [fx, fy, fw, fh] of rects) {
    const left = Math.max(0, Math.round(fx * W));
    const top = Math.max(0, Math.round(fy * H));
    const width = Math.min(W - left, Math.round(fw * W));
    const height = Math.min(H - top, Math.round(fh * H));
    if (width < 2 || height < 2) continue;
    const sigma = Math.max(6, Math.min(width, height) * 0.45);
    // Blur a padded region so the edge of the mask has real pixels to sample.
    const pad = Math.ceil(sigma * 2);
    const ex = { left: Math.max(0, left - pad), top: Math.max(0, top - pad) };
    ex.width = Math.min(W - ex.left, width + pad * 2 + (left - ex.left - pad));
    ex.height = Math.min(H - ex.top, height + pad * 2 + (top - ex.top - pad));
    const blurred = await sharp(input).extract(ex).blur(sigma).toBuffer();
    const crop = await sharp(blurred).extract({ left: left - ex.left, top: top - ex.top, width, height }).toBuffer();
    layers.push({ input: crop, left, top });
  }
  return layers.length ? sharp(input).composite(layers).toBuffer() : sharp(input).toBuffer();
}

/**
 * Frames a source at `aspect` without cutting into the vehicle. If the source
 * is too wide to crop, it is shown whole on a blurred, darkened extension of itself.
 */
async function frame(buf, { aspect, width, car = [0, 1], focusY = 0.5 }) {
  const { width: W, height: H } = await sharp(buf).metadata();
  const height = Math.round(width / aspect);
  const srcAspect = W / H;
  if (srcAspect <= aspect) {
    const ch = Math.round(W / aspect);
    const top = Math.round(Math.min(Math.max(focusY * H - ch / 2, 0), H - ch));
    return sharp(buf).extract({ left: 0, top, width: W, height: ch }).resize(width, height);
  }
  const cw = Math.round(H * aspect);
  const margin = 0.02 * W;
  const need = (car[1] - car[0]) * W + margin * 2;
  if (need <= cw) {
    const centre = ((car[0] + car[1]) / 2) * W;
    const left = Math.round(Math.min(Math.max(centre - cw / 2, 0), W - cw));
    return sharp(buf).extract({ left, top: 0, width: cw, height: H }).resize(width, height);
  }
  const left = Math.max(0, Math.round(car[0] * W - margin));
  const right = Math.min(W, Math.round(car[1] * W + margin));
  const fg = await sharp(buf).extract({ left, top: 0, width: right - left, height: H }).resize({ width }).toBuffer();
  const fgH = (await sharp(fg).metadata()).height;
  const bg = await sharp(buf).resize(width, height, { fit: "cover" }).blur(40).modulate({ brightness: 0.28, saturation: 0.7 }).toBuffer();
  // Feather the top/bottom edges of the photo into the backdrop.
  const fade = Math.round(Math.min(48, fgH * 0.08));
  const mask = Buffer.from(
    `<svg width="${width}" height="${fgH}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${fade / fgH}" stop-color="#fff"/>` +
      `<stop offset="${1 - fade / fgH}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
      `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const feathered = await sharp(fg).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return sharp(bg).composite([{ input: feathered, top: Math.round((height - fgH) / 2), left: 0 }]);
}

const credit = (file) => {
  const m = meta[file];
  if (!m?.licence || !m.sourceUrl) throw new Error(`Missing Commons metadata for ${file}`);
  return { title: m.title, author: m.author || "Unknown", licence: m.licence, licenceUrl: m.licenceUrl, sourceUrl: m.sourceUrl };
};

const outDemo = join(ROOT, "public", "photos", "demo");
const outBanners = join(ROOT, "public", "photos", "banners");
mkdirSync(outDemo, { recursive: true });
mkdirSync(outBanners, { recursive: true });

const vehicles = {};
const cleaned = new Map();
for (const p of VEHICLE_PHOTOS) {
  const clean = await blurPlates(join(CACHE, `${p.n}.jpg`), p.blur);
  cleaned.set(p.n, clean);
  const name = String(p.n).padStart(4, "0");
  const img = await frame(clean, { aspect: 3 / 2, width: 1600, car: p.car, focusY: p.focusY });
  const info = await img.webp({ quality: 80, effort: 6 }).toFile(join(outDemo, `${name}.webp`));
  vehicles[p.n] = { src: `/photos/demo/${name}.webp`, width: info.width, height: info.height, alt: p.alt, credit: credit(p.file) };
  console.log(`✓ demo ${name}  ${(info.size / 1024).toFixed(0)} KB`);
}

const banners = {};
for (const [slug, { n, focusY }] of Object.entries(BANNERS)) {
  const p = VEHICLE_PHOTOS.find((x) => x.n === n);
  const img = await frame(cleaned.get(n), { aspect: 16 / 9, width: 2000, car: p.car, focusY: focusY ?? p.focusY });
  const info = await img.webp({ quality: 74, effort: 6 }).toFile(join(outBanners, `${slug}.webp`));
  banners[slug] = { src: `/photos/banners/${slug}.webp`, width: info.width, height: info.height, vehicle: n };
  console.log(`✓ banner ${slug}  ${(info.size / 1024).toFixed(0)} KB`);
}

writeFileSync(
  join(ROOT, "src", "lib", "demo", "photos.generated.json"),
  JSON.stringify({ note: "GENERATED by tools/photos/process.mjs — do not edit by hand.", vehicles, banners }, null, 2) + "\n",
);
console.log("Wrote src/lib/demo/photos.generated.json");
