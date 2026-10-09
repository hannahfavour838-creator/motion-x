/**
 * Privacy-conscious event tracking. Events are sent only when a Plausible
 * domain is configured AND the visitor has not opted out on /cookies.
 * No personal data (names, emails, messages) is ever included.
 */
export type AnalyticsEvent =
  | "search"
  | "listing_view"
  | "enquiry_submitted"
  | "inspection_requested"
  | "seller_signup"
  | "buyer_signup"
  | "listing_submitted"
  | "dealer_onboarding"
  | "showroom_open";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function analyticsOptedOut(): boolean {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").some((c) => c === "mx_analytics=off");
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || analyticsOptedOut()) return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* never let analytics break the page */
  }
}
