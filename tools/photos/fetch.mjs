// Downloads the manifest's Commons photos (≈1920 px) and their metadata into
// .photo-cache/. Re-runs skip files already cached.   node tools/photos/fetch.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VEHICLE_PHOTOS } from "./manifest.mjs";

const CACHE = join(import.meta.dirname, "..", "..", ".photo-cache");
const UA = "MOTION-X-photo-tool/1.0 (demo inventory attribution)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = "json") {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return as === "json" ? res.json() : Buffer.from(await res.arrayBuffer());
    await sleep(3000 * (i + 1));
  }
  throw new Error(`Failed: ${url}`);
}

const strip = (html = "") => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

mkdirSync(CACHE, { recursive: true });
const metaPath = join(CACHE, "meta.json");
const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : {};

for (const p of VEHICLE_PHOTOS) {
  const raw = join(CACHE, `${p.n}.jpg`);
  if (meta[p.file] && existsSync(raw)) continue;
  const q = new URLSearchParams({
    action: "query", format: "json", titles: `File:${p.file}`, prop: "imageinfo",
    iiprop: "url|size|extmetadata", iiurlwidth: "1920",
  });
  const data = await get(`https://commons.wikimedia.org/w/api.php?${q}`);
  const page = Object.values(data.query.pages)[0];
  const ii = page.imageinfo?.[0];
  if (!ii) throw new Error(`Not found on Commons: ${p.file}`);
  const m = ii.extmetadata;
  meta[p.file] = {
    title: p.file,
    sourceUrl: ii.descriptionurl,
    author: strip(m.Artist?.value),
    licence: m.LicenseShortName?.value,
    licenceUrl: m.LicenseUrl?.value ?? null,
    credit: strip(m.Credit?.value),
    originalWidth: ii.width,
    originalHeight: ii.height,
  };
  const url = ii.width > 1920 ? ii.thumburl : ii.url;
  writeFileSync(raw, await get(url, "buffer"));
  writeFileSync(metaPath, JSON.stringify(meta, null, 1));
  console.log(`✓ ${p.n} ${p.file} — ${meta[p.file].licence}`);
  await sleep(1500);
}
console.log("cached", Object.keys(meta).length, "photos");
