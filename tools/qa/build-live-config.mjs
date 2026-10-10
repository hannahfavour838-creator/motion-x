// Regression test: a production build must succeed when Supabase is configured
// but the database is unavailable or has no schema yet (e.g. a first Vercel
// deploy before migrations), and runtime database failures must surface as
// errors — never as fake empty results.
//
// It never contacts Supabase: the URL uses the reserved ".invalid" domain,
// which cannot resolve, and the key is a dummy. Builds into .next-live-test/
// so the normal .next output is untouched.
//
// Usage: npm run test:build-live
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

const DIST = ".next-live-test";
const PORT = 3125;
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.invalid",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_build_test_dummy",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  SHOW_PUBLIC_DEMO_INVENTORY: "",
  MX_DIST_DIR: DIST,
};
let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(ok ? "✓" : "✗", label, detail);
};

rmSync(DIST, { recursive: true, force: true });
// next build rewrites tsconfig.json to include the build folder's types; keep it untouched.
const tsconfig = readFileSync("tsconfig.json", "utf8");
const restoreTsconfig = () => writeFileSync("tsconfig.json", tsconfig);
process.on("exit", restoreTsconfig);

// 1. Build
console.log("→ next build with Supabase configured but unreachable …");
const build = spawnSync("npx", ["next", "build"], { env, shell: true, encoding: "utf8" });
const out = (build.stdout ?? "") + (build.stderr ?? "");
restoreTsconfig();
check(build.status === 0, "production build succeeds", build.status === 0 ? "" : `\n${out.split("\n").filter((l) => /error|Error/.test(l)).slice(0, 5).join("\n")}`);

const routeType = (route) => {
  const line = out.split("\n").find((l) => new RegExp(`^[┌├└] [○ƒ●] ${route.replace(/\//g, "\\/")}(\\s|$)`).test(l));
  return line ? line[2] : "?";
};
for (const r of ["/", "/collections", "/credits", "/dealers/directory", "/showroom", "/sitemap.xml"]) {
  check(routeType(r) === "ƒ", `${r} renders at request time (not prerendered against the database)`, `[${routeType(r)}]`);
}
for (const r of ["/about", "/privacy", "/terms", "/dealers", "/sell"]) {
  check(routeType(r) === "○", `${r} stays statically generated`, `[${routeType(r)}]`);
}

// 2. Runtime behaviour with the database unavailable
if (build.status === 0) {
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], { env, shell: true, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  server.stdout.on("data", (d) => (log += d));
  server.stderr.on("data", (d) => (log += d));
  const base = `http://localhost:${PORT}`;
  try {
    for (let i = 0; i < 60; i++) {
      try { await fetch(`${base}/about`); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
    }
    const get = async (p) => { const res = await fetch(base + p); return { status: res.status, body: await res.text() }; };

    const dir = await get("/dealers/directory");
    check(dir.status === 500, "/dealers/directory returns a server error when the database fails", `[HTTP ${dir.status}]`);
    check(!dir.body.includes("No dealerships yet"), "/dealers/directory does not pretend there are no dealers");

    const home = await get("/");
    check(home.status === 200, "homepage stays available when secondary data fails", `[HTTP ${home.status}]`);
    const about = await get("/about");
    check(about.status === 200, "static pages are unaffected", `[HTTP ${about.status}]`);
    const sitemap = await get("/sitemap.xml");
    check(sitemap.status === 200 && sitemap.body.includes("/about"), "sitemap still lists static pages", `[HTTP ${sitemap.status}]`);

    await new Promise((r) => setTimeout(r, 500));
    check(/\[data\] homepage featured vehicles failed/.test(log), "secondary-data failures are logged on the server, not silent");
  } finally {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
    else server.kill("SIGTERM");
  }

  // 3. Public demo mode ON + database unavailable: the failure must surface, never demo cars.
  const demoPort = PORT + 1;
  const demoServer = spawn("npx", ["next", "start", "-p", String(demoPort)], {
    env: { ...env, SHOW_PUBLIC_DEMO_INVENTORY: "true" }, shell: true, stdio: "ignore",
  });
  try {
    const demoBase = `http://localhost:${demoPort}`;
    for (let i = 0; i < 60; i++) {
      try { await fetch(`${demoBase}/about`); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
    }
    const cars = await fetch(`${demoBase}/cars`);
    const body = await cars.text();
    // /cars has a loading.tsx, so the response streams with 200 before the error
    // is raised; the error boundary ("We couldn't load vehicles") is delivered in
    // the stream and identified by its error digest.
    check(/\\?"digest\\?":/.test(body), "public demo mode: a database failure on /cars reaches the error boundary", `[HTTP ${cars.status}]`);
    check(!body.includes("Demo vehicle") && !body.includes("Demonstration inventory"), "public demo mode: no demo vehicles are shown when the database check fails");
    check(!body.includes("No vehicles found"), "public demo mode: the failure is not disguised as an empty result");
  } finally {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(demoServer.pid), "/t", "/f"], { stdio: "ignore" });
    else demoServer.kill("SIGTERM");
  }
}

rmSync(DIST, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) FAILED` : "\nall live-config build checks pass");
process.exit(failures ? 1 : 0);
