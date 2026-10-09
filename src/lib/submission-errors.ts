/**
 * Maps database errors from enquiry / inspection / report / contact inserts to
 * user-facing messages. Raw database text is never shown.
 *
 * Rate limits: the database raises the same "Too many …" error for personal
 * limits (per email or per signed-in user) and for shared limits (per listing
 * or site-wide, which apply only to anonymous submissions — see migration
 * 20261009000300_hardening.sql). Signed-in users can only hit personal limits,
 * so they get a personal message; anonymous visitors get a neutral one that
 * does not claim they personally sent too many requests.
 */
export const RATE_LIMITED_SIGNED_IN: string = "You have sent several requests recently. Please try again later.";
export const RATE_LIMITED_ANONYMOUS: string =
  "This form is receiving a high number of requests, so new submissions are paused for a short while. Please try again later.";

export function submissionErrorMessage(dbMessage: string | undefined, fallback: string, signedIn: boolean): string {
  if (dbMessage?.includes("Too many")) return signedIn ? RATE_LIMITED_SIGNED_IN : RATE_LIMITED_ANONYMOUS;
  if (dbMessage?.includes("not available")) return "This vehicle is no longer accepting enquiries.";
  if (dbMessage?.includes("own listing")) return "You cannot enquire about your own listing.";
  if (dbMessage?.includes("inspection")) return "This seller has not enabled inspection requests.";
  return fallback;
}
