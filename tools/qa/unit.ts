// Unit tests for security-sensitive helpers.   npm run test:unit
import { safeRedirectPath } from "../../src/lib/safe-redirect";
const BS = String.fromCharCode(92), TAB = "\t", NL = "\n";
const cases: [unknown, string][] = [
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
let fail = 0;
for (const [input, want] of cases) {
  const got = safeRedirectPath(input, "FB");
  const ok = got === want;
  if (!ok) fail++;
  console.log(ok ? "✓" : "✗", JSON.stringify(input), "→", JSON.stringify(got));
}
console.log(fail ? `${fail} FAILED` : "all redirect cases pass");
process.exitCode = fail ? 1 : 0;
