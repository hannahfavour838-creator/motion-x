// Automated accessibility audit (axe-core, WCAG 2.1 A/AA) of public pages.
// Usage: BASE_URL=http://localhost:3000 node tools/qa/a11y.mjs   (set CHROMIUM_PATH if needed)
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/cars", "/cars/2021-porsche-911-carrera-s-demo01", "/collections", "/showroom", "/showroom/concept-car", "/compare", "/sell", "/dealers", "/dealers/directory", "/credits", "/sign-in", "/sign-up", "/contact"];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let total = 0;
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.addScriptTag({ path: AXE });
    const violations = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) , count: v.nodes.length }));
    });
    total += violations.length;
    console.log(`${violations.length ? "✗" : "✓"} ${width}px ${path}`);
    for (const v of violations) console.log(`    [${v.impact}] ${v.id} ×${v.count}: ${v.help}\n      ${v.nodes.join("\n      ")}`);
  }
  await page.close();
}
await browser.close();
console.log(total ? `\n${total} violation group(s)` : "\nNo WCAG A/AA violations detected");
process.exitCode = total ? 1 : 0;
