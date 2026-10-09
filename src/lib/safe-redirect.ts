const BASE = "https://same-origin.invalid";

/**
 * Returns `next` only if it is a same-site path, otherwise `fallback`.
 *
 * Prefix checks such as `startsWith("/") && !startsWith("//")` are not enough:
 * URL parsing treats `\` as `/` and strips tabs and newlines, so values like
 * "/\evil.com" or "/<TAB>/evil.com" resolve to another host. Resolving against
 * a fixed origin and comparing origins is the reliable test.
 */
export function safeRedirectPath(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  try {
    const url = new URL(next, BASE);
    if (url.origin !== BASE) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
