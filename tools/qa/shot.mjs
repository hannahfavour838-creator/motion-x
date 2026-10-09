// Usage: node tools/qa/shot.mjs <url> <out.png> [width] [height] [waitMs] [scrollY]
import { chromium } from "playwright";
const [url, out, w = "1440", h = "900", wait = "4000", scrollY = "0", full = ""] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: process.env.REDUCED ? "reduce" : "no-preference" });
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
if (full === "full") {
  // Scroll through the page so lazy images and reveal animations trigger.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
  await page.evaluate(() => window.scrollTo(0, 0));
}
if (+scrollY) { await page.evaluate((y) => window.scrollTo(0, y), +scrollY); }
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: full === "full", timeout: 240000, animations: "allow" });
console.log(logs.slice(0, 30).join("\n") || "no console errors");
await browser.close();
