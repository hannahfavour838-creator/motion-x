// Unit tests for security-sensitive and user-facing helpers.   npm run test:unit
import { safeRedirectPath } from "../../src/lib/safe-redirect";
import { RATE_LIMITED_ANONYMOUS, RATE_LIMITED_SIGNED_IN, submissionErrorMessage } from "../../src/lib/submission-errors";
import { classifyUploadStartFailure, UPLOAD_START_MESSAGES, uploadTransferMessage } from "../../src/lib/upload-errors";
import { readFileSync } from "node:fs";
import { isDemoDealerSlug, isDemoSellerId, isDemoVehicleId, publicDemoFlagFrom, shouldUseBuiltInDemo } from "../../src/lib/demo-mode";
import { DEMO_SELLERS, DEMO_VEHICLES } from "../../src/lib/demo/inventory";
import { allDemoVehicles } from "../../src/lib/data/mappers";

let fail = 0;
let total = 0;
function check(group: string, label: string, ok: boolean, detail = "") {
  total++;
  if (!ok) fail++;
  console.log(ok ? "✓" : "✗", `[${group}]`, label, detail);
}

// ── Safe redirects ──────────────────────────────────────────────────────
const BS = String.fromCharCode(92), TAB = "\t", NL = "\n";
const redirects: [unknown, string][] = [
  ["/account", "/account"],
  ["/dashboard/listings?status=draft#top", "/dashboard/listings?status=draft#top"],
  ["/cars?make=Porsche&q=911", "/cars?make=Porsche&q=911"],
  ["//evil.com", "FB"],
  ["/" + BS + "evil.com", "FB"],
  ["/" + BS + "/evil.com", "FB"],
  ["/" + TAB + "/evil.com", "FB"],
  ["/" + NL + "/evil.com", "FB"],
  ["https://evil.com", "FB"],
  ["javascript:alert(1)", "FB"],
  ["evil.com", "FB"],
  [null, "FB"], [42, "FB"], ["", "FB"],
];
for (const [input, want] of redirects) {
  const got = safeRedirectPath(input, "FB");
  check("redirect", JSON.stringify(input), got === want, `→ ${JSON.stringify(got)}`);
}

// ── Submission errors (exact strings raised by the migrations) ──────────
const FALLBACK = "We couldn't send your enquiry. Please try again.";
const submissionCases: [string | undefined, boolean, string][] = [
  // Same text is raised for per-email limits and for the shared per-listing / site-wide quotas.
  ["Too many requests. Please try again later.", false, RATE_LIMITED_ANONYMOUS],
  ["Too many requests. Please try again later.", true, RATE_LIMITED_SIGNED_IN],
  ["Too many reports. Please try again later.", false, RATE_LIMITED_ANONYMOUS],
  ["Too many reports. Please try again later.", true, RATE_LIMITED_SIGNED_IN],
  ["Too many messages. Please try again later.", false, RATE_LIMITED_ANONYMOUS],
  ["Too many messages. Please try again later.", true, RATE_LIMITED_SIGNED_IN],
  ["This vehicle is not available for enquiries", false, "This vehicle is no longer accepting enquiries."],
  ["You cannot enquire about your own listing", true, "You cannot enquire about your own listing."],
  ["This seller has not enabled inspection requests", false, "This seller has not enabled inspection requests."],
  ['duplicate key value violates unique constraint "enquiries_pkey"', false, FALLBACK],
  ["permission denied for table enquiries", true, FALLBACK],
  [undefined, false, FALLBACK],
];
for (const [db, signedIn, want] of submissionCases) {
  const got = submissionErrorMessage(db, FALLBACK, signedIn);
  check("submission", `${signedIn ? "signed-in" : "anonymous"}: ${JSON.stringify(db)}`, got === want, `→ ${JSON.stringify(got)}`);
}
check("submission", "anonymous limit message makes no personal claim", !/\byou have sent\b|\byou've sent\b|\byour requests\b/i.test(RATE_LIMITED_ANONYMOUS));
check("submission", "signed-in and anonymous limit messages differ", RATE_LIMITED_ANONYMOUS !== RATE_LIMITED_SIGNED_IN);

// ── Upload start failures (signed-URL refusals) ─────────────────────────
const rls = { message: "new row violates row-level security policy", statusCode: "403" };
const startCases: [Parameters<typeof classifyUploadStartFailure>[0], keyof typeof UPLOAD_START_MESSAGES][] = [
  [{ listingStatus: "suspended", folderObjectCount: 3, error: rls }, "listing_suspended"],
  [{ listingStatus: "active", folderObjectCount: 30, error: rls }, "folder_full"],
  [{ listingStatus: "active", folderObjectCount: 31, error: rls }, "folder_full"],
  [{ listingStatus: "active", folderObjectCount: 29, error: rls }, "not_permitted"],
  [{ listingStatus: "draft", folderObjectCount: null, error: { message: "Unauthorized", status: 401 } }, "not_permitted"],
  [{ listingStatus: "active", folderObjectCount: 2, error: { message: "row-level security", status: 400 } }, "not_permitted"],
  [{ listingStatus: "active", folderObjectCount: 2, error: { message: "Internal Server Error", status: 500 } }, "unavailable"],
  [{ listingStatus: "active", folderObjectCount: null, error: null }, "unavailable"],
];
for (const [input, want] of startCases) {
  const got = classifyUploadStartFailure(input);
  check("upload-start", `${input.listingStatus}, ${input.folderObjectCount} objects, ${JSON.stringify(input.error)}`, got === want, `→ ${got}`);
}
for (const msg of Object.values(UPLOAD_START_MESSAGES)) {
  check("upload-start", `no internal detail in ${JSON.stringify(msg.slice(0, 40))}…`, !/row-level|policy|storage\.|supabase|token|\/\w+\/|\b\d{3}\b/i.test(msg));
}

// ── Upload transfer failures (browser → signed URL) ─────────────────────
const transferCases: [number, RegExp][] = [
  [0, /connection was interrupted/i],
  [413, /too large.*10 MB/i],
  [415, /file type isn't supported/i],
  [401, /expired or was refused/i],
  [403, /expired or was refused/i],
  [409, /already uploaded/i],
  [429, /too many uploads/i],
  [400, /JPEG, PNG, WebP or AVIF/],
  [500, /temporarily unavailable/i],
  [503, /temporarily unavailable/i],
  [418, /^The upload failed\. Please try again\.$/],
];
for (const [status, want] of transferCases) {
  const got = uploadTransferMessage(status, 10);
  check("upload-transfer", `HTTP ${status}`, want.test(got) && !got.includes(`(${status})`), `→ ${JSON.stringify(got)}`);
}

// ── Built-in demo inventory fallback ────────────────────────────────────
const demoCases: [Parameters<typeof shouldUseBuiltInDemo>[0], boolean, string][] = [
  [{ supabaseConfigured: false, demoFlag: false, nodeEnv: "production", publicVehicleCount: null }, true, "preview mode (no Supabase) always uses demo data"],
  [{ supabaseConfigured: true, demoFlag: true, nodeEnv: "development", publicVehicleCount: 0 }, true, "dev + flag + empty database → demo fallback"],
  [{ supabaseConfigured: true, demoFlag: true, nodeEnv: "production", publicVehicleCount: 0 }, false, "PRODUCTION never uses the fallback, even with the flag on"],
  [{ supabaseConfigured: true, demoFlag: true, nodeEnv: "test", publicVehicleCount: 0 }, false, "non-development environments never use the fallback"],
  [{ supabaseConfigured: true, demoFlag: false, nodeEnv: "development", publicVehicleCount: 0 }, false, "flag off → database only"],
  [{ supabaseConfigured: true, demoFlag: true, nodeEnv: "development", publicVehicleCount: 1 }, false, "one real public listing → database takes over"],
  [{ supabaseConfigured: true, demoFlag: true, nodeEnv: "development", publicVehicleCount: null }, false, "unknown count → database (never guess)"],
];
for (const [input, want, label] of demoCases) check("demo-fallback", label, shouldUseBuiltInDemo(input) === want);
check("demo-fallback", "every built-in vehicle id is recognised as demo", DEMO_VEHICLES.every((v) => isDemoVehicleId(v.id)));
check("demo-fallback", "every built-in seller id is recognised as demo", DEMO_SELLERS.every((x) => isDemoSellerId(x.id)));
check("demo-fallback", "every built-in dealer slug is recognised as demo", DEMO_SELLERS.filter((x) => x.slug).every((x) => isDemoDealerSlug(x.slug!)));
check("demo-fallback", "a random real UUID is not treated as demo", !isDemoVehicleId("3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c") && !isDemoSellerId("3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c"));
check("demo-fallback", "a real dealer slug is not treated as demo", !isDemoDealerSlug("northline-motors-ab12"));

// ── Public demo mode (SHOW_PUBLIC_DEMO_INVENTORY) ───────────────────────
const prod = { supabaseConfigured: true, demoFlag: false, nodeEnv: "production" } as const;
check("public-demo", "production: OFF by default (variable unset)", shouldUseBuiltInDemo({ ...prod, publicVehicleCount: 0 }) === false);
check("public-demo", "production: ON when explicitly enabled and no real listings", shouldUseBuiltInDemo({ ...prod, publicDemoFlag: true, publicVehicleCount: 0 }) === true);
check("public-demo", "production: real listings take priority (1 listing → database only)", shouldUseBuiltInDemo({ ...prod, publicDemoFlag: true, publicVehicleCount: 1 }) === false);
check("public-demo", "production: failed/unknown count never activates demo data", shouldUseBuiltInDemo({ ...prod, publicDemoFlag: true, publicVehicleCount: null }) === false);
check("public-demo", "development fallback unchanged when public mode is off", shouldUseBuiltInDemo({ supabaseConfigured: true, demoFlag: true, nodeEnv: "development", publicVehicleCount: 0 }) === true);
for (const [value, want] of [[undefined, false], ["", false], ["false", false], ["TRUE", false], ["1", false], ["yes", false], ["true", true]] as const) {
  check("public-demo", `SHOW_PUBLIC_DEMO_INVENTORY=${JSON.stringify(value)} → ${want ? "on" : "off"}`, publicDemoFlagFrom(value) === want);
}

// Every demo vehicle is labelled and visibly fictional
const demos = allDemoVehicles();
check("demo-labels", `all ${demos.length} built-in vehicles are flagged isDemo (drives "Demo vehicle" badges and banners)`, demos.length > 0 && demos.every((v) => v.isDemo));
check("demo-labels", "all demo sellers are flagged as demonstration sellers", demos.every((v) => v.seller.isDemo));
check("demo-labels", "every demo description states it is a demonstration listing, not for sale", demos.every((v) => /demonstration listing/i.test(v.description ?? "") && /not a real vehicle for sale/i.test(v.description ?? "")));
check("demo-labels", "every demo photo is marked as representative (not the vehicle listed)", demos.every((v) => v.images.length > 0 && v.images.every((i) => i.illustrative)));
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
check("demo-labels", 'vehicle cards render a "Demo vehicle" badge for demo listings', /v\.isDemo && <Badge[^>]*>Demo vehicle<\/Badge>/.test(read("src/components/vehicles/vehicle-card.tsx")));
check("demo-labels", 'vehicle pages render a "Demonstration listing" notice for demo listings', /v\.isDemo && \([\s\S]{0,300}Demonstration listing/.test(read("src/app/(site)/cars/[slug]/page.tsx")));
check("demo-labels", "demo vehicle pages are excluded from search-engine indexing", /robots: v\.isDemo \|\| !isPublic \? \{ index: false/.test(read("src/app/(site)/cars/[slug]/page.tsx")));

// Demo vehicles can never trigger real enquiries, inspections, reports, saves or views
const actions = read("src/app/actions/public.ts");
/** Source of one exported function: from its declaration up to the next exported function (or end of file). */
const fnBody = (src: string, name: string) => {
  const start = src.indexOf(`export async function ${name}(`);
  const next = src.indexOf("\nexport async function", start + 1);
  return src.slice(start, next === -1 ? undefined : next);
};
for (const fn of ["submitEnquiry", "requestInspection", "reportListing"]) {
  const body = fnBody(actions, fn);
  const guard = body.indexOf("isDemoVehicle("), db = body.indexOf("createClient(");
  check("demo-guards", `${fn}: refuses demo vehicles before any database call`, guard > 0 && db > guard);
}
const view = fnBody(actions, "recordView");
check("demo-guards", "recordView: skips demo vehicles before the database", view.indexOf("isDemoVehicleId(") > 0 && view.indexOf("isDemoVehicleId(") < view.indexOf("createServiceClient("));
const providers = read("src/components/providers/app-providers.tsx");
check("demo-guards", "saving a demo vehicle returns before any database write", providers.indexOf('if (isDemoVehicleId(vehicleId)) return "demo"') > 0 && providers.indexOf('if (isDemoVehicleId(vehicleId)) return "demo"') < providers.indexOf('.from("favourites").insert'));
check("demo-guards", "every built-in demo id is caught by the guards", DEMO_VEHICLES.every((v) => isDemoVehicleId(v.id)));

// Database failures are not hidden behind demo data
const fallbackSrc = read("src/lib/data/demo-fallback.ts");
check("demo-errors", "a failing listing count throws instead of falling back to demo data", /if \(error\) throw new Error\(`Inventory check failed/.test(fallbackSrc));

console.log(fail ? `\n${fail} of ${total} FAILED` : `\nall ${total} unit cases pass`);
process.exitCode = fail ? 1 : 0;
