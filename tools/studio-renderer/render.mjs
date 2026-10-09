// Usage: node tools/studio-renderer/render.mjs <jobs.json>
// jobs.json: [{ "out": "public/renders/x.webp", "params": { ... } }]
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const only = process.argv[3];

const types = { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.error("pageerror", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("console", m.text()); });

for (const job of jobs) {
  if (only && !job.out.includes(only)) continue;
  const p = { w: 1600, h: 1000, ...job.params };
  await page.setViewportSize({ width: p.w, height: p.h });
  const t0 = Date.now();
  await page.goto(`http://localhost:${port}/tools/studio-renderer/index.html?p=${encodeURIComponent(JSON.stringify(p))}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 180000 });
  const png = await page.screenshot({ type: "png", timeout: 240000, animations: "allow" });
  fs.mkdirSync(path.dirname(path.join(root, job.out)), { recursive: true });
  await sharp(png).webp({ quality: job.quality ?? 82 }).toFile(path.join(root, job.out));
  console.log(`✓ ${job.out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
await browser.close();
server.close();
