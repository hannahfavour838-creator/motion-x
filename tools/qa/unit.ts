// Unit tests for security-sensitive and user-facing helpers.   npm run test:unit
import { safeRedirectPath } from "../../src/lib/safe-redirect";
import { RATE_LIMITED_ANONYMOUS, RATE_LIMITED_SIGNED_IN, submissionErrorMessage } from "../../src/lib/submission-errors";
import { classifyUploadStartFailure, UPLOAD_START_MESSAGES, uploadTransferMessage } from "../../src/lib/upload-errors";

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

console.log(fail ? `\n${fail} of ${total} FAILED` : `\nall ${total} unit cases pass`);
process.exitCode = fail ? 1 : 0;
