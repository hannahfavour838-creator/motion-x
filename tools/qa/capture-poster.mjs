// Captures the hero poster stills from the live 3D scene so the static
// fallback matches the interactive studio exactly.
//   BASE_URL=http://localhost:3000 node tools/qa/capture-poster.mjs
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const shots = [
  { out: "public/renders/hero-fallback.webp", viewport: { width: 1500, height: 844 }, dpr: 1.6, quality: 84 },
  { out: "public/renders/hero-fallback-mobile.webp", viewport: { width: 432, height: 640 }, dpr: 2.5, quality: 80, crop: { height: 1500 } },
];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const s of shots) {
  const page = await browser.newPage({ viewport: s.viewport, deviceScaleFactor: s.dpr, reducedMotion: "reduce" });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hero-canvas] canvas", { timeout: 120000 });
  await page.waitForFunction(() => !document.body.innerText.includes("Preparing studio"), null, { timeout: 180000 });
  await page.addStyleTag({ content: `header,#mobile-menu,nextjs-portal{display:none!important} section[aria-labelledby=hero-title] > *:not([data-hero-canvas]){visibility:hidden!important} [data-hero-canvas]{opacity:1!important}` });
  await page.waitForTimeout(8000);
  const png = await page.locator("[data-hero-canvas]").screenshot({ timeout: 240000 });
  let img = sharp(png);
  if (s.crop) img = img.extract({ left: 0, top: 0, width: Math.round(s.viewport.width * s.dpr), height: s.crop.height });
  await img.webp({ quality: s.quality }).toFile(s.out);
  console.log("✓", s.out);
  await page.close();
}
await browser.close();
