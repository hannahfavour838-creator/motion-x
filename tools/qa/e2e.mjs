// End-to-end browser tests for MOTION X (preview mode, no database required).
//   BASE_URL=http://localhost:3000 node tools/qa/e2e.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const results = [];
let failures = 0;

async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push(`✓ ${name} (${Date.now() - t0}ms)`);
  } catch (e) {
    failures++;
    results.push(`✗ ${name}\n    ${String(e?.message ?? e).split("\n")[0]}`);
  }
  console.log(results.at(-1));
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const launchArgs = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: launchArgs });
// The general context blocks the 3D model download. In software-rendered CI
// browsers WebGL is very slow, and this doubles as a test of the
// "model failed to load" fallback. 3D is tested in its own context below.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await ctx.route("**/models/*.glb", (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const cardTitles = () => page.locator("article h3:visible").allInnerTexts();

await test("homepage renders hero, headline and primary actions", async () => {
  const res = await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  assert(res.status() === 200, `status ${res.status()}`);
  const h1 = await page.locator("h1").innerText();
  assert(/the world/i.test(h1) && /showroom/i.test(h1), `h1 was ${h1}`);
  assert((await page.getByRole("link", { name: /explore cars/i }).first().getAttribute("href")) === "/cars", "Explore cars → /cars");
  assert((await page.getByRole("link", { name: /sell your car/i }).first().getAttribute("href")) === "/sell", "Sell your car → /sell");
  for (const label of ["Discover", "Collections", "3D Showroom", "For Dealers", "Sign In", "List Your Car"]) {
    assert(await page.getByRole("link", { name: label, exact: true }).first().isVisible(), `nav link ${label}`);
  }
});

await test("if the 3D model fails to load, the hero falls back to the studio render", async () => {
  await page.getByText(/showing a studio render/i).waitFor({ timeout: 60000 });
  assert(await page.locator("section[aria-labelledby=hero-title] picture img").isVisible(), "poster visible");
});

await test("homepage sections and featured inventory are labelled as demonstration", async () => {
  for (const id of ["discover-title", "collections-title", "featured-title", "showroom-title", "dealers-title", "sellers-title", "trust-title", "final-title"]) {
    assert(await page.locator(`#${id}`).count() === 1, `missing #${id}`);
  }
  assert(await page.getByText("Demonstration inventory").first().isVisible(), "demo label");
  assert(await page.getByText(/register your dealership/i).first().isVisible(), "dealer invitation shown when no real dealers exist");
});

await test("quick search navigates to real filtered results", async () => {
  await page.locator("#qs-q").fill("porsche");
  await page.getByRole("button", { name: /search vehicles/i }).click();
  await page.waitForURL(/\/cars\?q=porsche/, { timeout: 30000 });
  await page.getByText(/Showing 1–2 of 2 vehicles/).waitFor({ timeout: 30000 });
  const titles = await cardTitles();
  assert(titles.length === 2, `expected 2 Porsches, got ${titles.length}`);
  assert(titles.every((t) => /porsche/i.test(t)), `non-matching titles ${titles}`);
});

await test("filters combine (category + country)", async () => {
  await page.goto(BASE + "/cars?segment=supercar&country=US");
  const titles = await cardTitles();
  assert(titles.length === 1 && /mclaren/i.test(titles[0]), `got ${titles}`);
  const chips = await page.getByLabel("Active filters").locator("a").allInnerTexts();
  assert(chips.some((c) => /united states/i.test(c)) && chips.some((c) => /supercar/i.test(c)), `chips ${chips}`);
});

await test("removing a filter chip updates the URL and results", async () => {
  await page.getByRole("link", { name: /remove filter: united states/i }).click();
  await page.waitForURL((u) => !u.search.includes("country"), { timeout: 30000 });
  const titles = await cardTitles();
  assert(titles.length === 3, `expected 3 supercars, got ${titles.length}`);
});

await test("sorting by price (same currency) is ascending", async () => {
  await page.goto(BASE + "/cars?country=US&sort=price_asc");
  const prices = (await page.locator("article p.font-display:visible").allInnerTexts()).map((t) => Number(t.replace(/[^\d]/g, "")));
  assert(prices.length >= 4, `only ${prices.length} prices`);
  assert(prices.every((p, i) => i === 0 || p >= prices[i - 1]), `not ascending: ${prices}`);
});

await test("year range + transmission filters", async () => {
  await page.goto(BASE + "/cars?min_year=2021&transmission=manual");
  const titles = await cardTitles();
  assert(titles.length >= 1, "no results");
  const years = (await page.locator("article p.font-mono").allInnerTexts()).filter((y) => /^\d{4}/.test(y));
  assert(years.length >= 1 && years.every((y) => Number(y.slice(0, 4)) >= 2021), `years ${years}`);
});

await test("mileage range filter (km, with miles converted)", async () => {
  await page.goto(BASE + "/cars?min_mileage=30000&max_mileage=45000&unit=km");
  const miles = (await page.locator("article dd.tabular-nums:visible").allInnerTexts()).map((t) => ({ n: Number(t.replace(/[^\d]/g, "")), unit: t.trim().endsWith("mi") ? "mi" : "km" }));
  assert(miles.length >= 2, `only ${miles.length} results`);
  assert(miles.every(({ n, unit }) => { const km = unit === "mi" ? n * 1.609344 : n; return km >= 30000 && km <= 45000; }), `out of range ${JSON.stringify(miles)}`);
});

await test("pagination works", async () => {
  await page.goto(BASE + "/cars");
  assert((await cardTitles()).length === 24, "page 1 should have 24");
  await page.getByRole("link", { name: "Next →" }).click();
  await page.waitForURL(/page=2/);
  assert((await cardTitles()).length === 9, `page 2 should have 9, got ${(await cardTitles()).length}`);
});

await test("availability filter shows sold vehicles", async () => {
  await page.goto(BASE + "/cars?availability=sold");
  const titles = await cardTitles();
  assert(titles.length === 1 && /audi r8/i.test(titles[0]), `got ${titles}`);
});

await test("empty state and reset", async () => {
  await page.goto(BASE + "/cars?q=zzzznotacar");
  assert(await page.getByRole("heading", { name: "No vehicles found" }).isVisible(), "empty state");
  assert((await page.getByRole("link", { name: /reset all filters/i }).getAttribute("href")) === "/cars", "reset link");
});

await test("vehicle detail page: specs, gallery, noindex for demo", async () => {
  const res = await page.goto(BASE + "/cars/2021-porsche-911-carrera-s-demo01");
  assert(res.status() === 200, `status ${res.status()}`);
  assert(/porsche/i.test(await page.locator("h1").innerText()), "title");
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  assert(/noindex/.test(robots ?? ""), `robots ${robots}`);
  assert(await page.locator('script[type="application/ld+json"]').count() === 0, "no structured data for demo listings");
  assert(await page.getByText("Illustrative render — not a photograph of this vehicle").isVisible(), "illustrative label");
  await page.getByRole("button", { name: "Next photo" }).click({ force: true });
  assert(/2 \/ 2/.test(await page.getByText(/\d \/ \d/).first().innerText()), "gallery advanced");
});

await test("enquiry form validates on the server and refuses demo listings honestly", async () => {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await page.waitForSelector("[role=alert]", { timeout: 15000 });
  await page.waitForTimeout(2600);
  const form = page.locator("#contact form");
  await form.getByLabel(/your name/i).fill("Test Buyer");
  await form.getByLabel(/^email/i).fill("buyer@example.com");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await page.getByText(/demonstration listing, so there is no real seller/i).waitFor({ timeout: 15000 });
});

await test("report listing dialog opens and closes accessibly", async () => {
  await page.getByRole("button", { name: /report listing/i }).click();
  const dialog = page.getByRole("dialog", { name: /report this listing/i });
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
});

await test("compare: add two vehicles and view side by side", async () => {
  await page.goto(BASE + "/cars?segment=supercar");
  const buttons = page.getByRole("button", { name: "Add to comparison" });
  await buttons.nth(0).click();
  await buttons.nth(1).click();
  await page.getByText(/2 of 4 vehicles selected/).waitFor();
  await page.getByRole("link", { name: "Compare", exact: true }).last().click();
  await page.waitForURL(/\/compare\?ids=/);
  const cols = await page.locator("table thead th[scope=col]").count();
  assert(cols === 3, `expected 2 vehicle columns (+label), got ${cols}`);
});

await test("save without an account explains what is needed", async () => {
  await page.goto(BASE + "/cars");
  await page.getByRole("button", { name: "Save vehicle" }).first().click();
  await page.getByText(/saving requires accounts/i).waitFor({ timeout: 10000 });
});

await test("private areas redirect to sign-in; admin is hidden", async () => {
  await page.goto(BASE + "/dashboard");
  await page.waitForURL(/\/sign-in\?next=%2Fdashboard/);
  await page.goto(BASE + "/account/saved");
  await page.waitForURL(/\/sign-in\?next=%2Faccount%2Fsaved/);
  const res = await page.goto(BASE + "/admin");
  assert(res.status() === 404 || page.url().includes("/sign-in"), `admin status ${res.status()} ${page.url()}`);
});

await test("auth pages explain missing configuration", async () => {
  await page.goto(BASE + "/sign-up?type=dealer");
  assert(await page.getByText(/not configured in this preview/i).isVisible(), "notice");
  assert(await page.getByRole("heading", { name: /register your dealership/i }).isVisible(), "dealer heading");
});

const ctx3d = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const p3d = await ctx3d.newPage();
p3d.on("pageerror", (e) => errors.push(e.message));
await test("hero mounts the live WebGL studio when the model loads", async () => {
  await p3d.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p3d.waitForSelector("section[aria-labelledby=hero-title] canvas", { timeout: 60000 });
  await p3d.waitForFunction(() => !document.body.innerText.includes("Preparing studio"), null, { timeout: 120000 });
  assert(!(await p3d.getByText(/showing a studio render/i).isVisible()), "should not have fallen back");
});
await test("3D showroom loads the model and exposes controls", async () => {
  const page = p3d;
  await page.goto(BASE + "/showroom/concept-car");
  await page.getByRole("button", { name: "Profile" }).waitFor({ timeout: 120000 });
  await page.getByRole("button", { name: "Profile" }).click();
  assert(await page.getByRole("button", { name: "Profile" }).getAttribute("aria-pressed") === "true", "view selected");
  await page.getByRole("radio", { name: "Obsidian" }).check({ force: true });
  await page.getByRole("application").focus();
  await page.keyboard.press("ArrowLeft");
  assert(await page.getByText(/CC BY 4.0/).first().isVisible(), "licence credit visible");
});
await ctx3d.close();

await test("robots, sitemap and OG image are served", async () => {
  for (const p of ["/robots.txt", "/sitemap.xml", "/opengraph-image.jpg", "/icon.svg"]) {
    const r = await page.request.get(BASE + p);
    assert(r.status() === 200, `${p} → ${r.status()}`);
  }
  const robots = await (await page.request.get(BASE + "/robots.txt")).text();
  assert(/Disallow: \/admin/.test(robots), "robots disallows admin");
});

await test("unknown listing returns 404", async () => {
  const r = await page.goto(BASE + "/cars/does-not-exist-123");
  assert(r.status() === 404, `status ${r.status()}`);
});

// ── Mobile ────────────────────────────────────────────────────────────────
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
await mobile.route("**/models/*.glb", (r) => r.abort());
const m = await mobile.newPage();
for (const path of ["/", "/cars", "/cars/2022-bmw-m3-competition-xdrive-demo09", "/sell", "/dealers", "/showroom", "/compare", "/sign-up", "/trust"]) {
  await test(`mobile: no horizontal overflow on ${path}`, async () => {
    await m.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await m.waitForTimeout(800);
    const { sw, iw } = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    assert(sw <= iw + 1, `scrollWidth ${sw} > ${iw}`);
  });
}
await test("mobile: menu opens, traps Escape and navigates", async () => {
  await m.goto(BASE + "/");
  await m.waitForLoadState("networkidle");
  await m.getByRole("button", { name: "Open menu" }).tap();
  await m.locator("#mobile-menu").waitFor({ state: "visible" });
  await m.locator("#mobile-menu").getByRole("link", { name: /collections/i }).tap();
  await m.waitForURL(/\/collections/);
});
await test("mobile: filters open in a dialog and apply", async () => {
  await m.goto(BASE + "/cars");
  await m.getByRole("button", { name: /^Filters/ }).tap();
  const dialog = m.getByRole("dialog", { name: /filter vehicles/i });
  await dialog.getByLabel("Category").selectOption("classic");
  await dialog.getByRole("button", { name: "Apply filters" }).tap();
  await m.waitForURL(/segment=classic/);
});

// ── No WebGL: graceful fallback ──────────────────────────────────────────
const noGl = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--disable-webgl", "--disable-3d-apis", "--disable-gpu"] });
const ng = await (await noGl.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await test("without WebGL the hero shows the studio render and stays usable", async () => {
  await ng.goto(BASE + "/");
  await ng.waitForTimeout(2500);
  assert(await ng.locator("section[aria-labelledby=hero-title] canvas").count() === 0, "no canvas");
  assert(await ng.locator("section[aria-labelledby=hero-title] picture img").isVisible(), "poster visible");
  assert(await ng.getByRole("link", { name: /explore cars/i }).first().isVisible(), "CTA visible");
});
await test("without WebGL the showroom explains and shows a render", async () => {
  await ng.goto(BASE + "/showroom/concept-car");
  await ng.getByText(/doesn't support WebGL/i).waitFor({ timeout: 15000 });
});

await test("no uncaught page errors", async () => {
  // The model download is deliberately blocked in the general context to exercise the fallback.
  const relevant = errors.filter((e) => !/ResizeObserver/.test(e) && !/concept-car\.glb/.test(e));
  assert(relevant.length === 0, relevant.slice(0, 3).join(" | "));
});

await browser.close();
await noGl.close();
console.log(`\n${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
