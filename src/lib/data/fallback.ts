import "server-only";
import { unstable_rethrow } from "next/navigation";

/**
 * For SECONDARY page data only (e.g. homepage showcases, collection counts):
 * if the query fails, the page still renders without that section instead of
 * showing an error page — but the failure is logged on the server so it is
 * never silent. Primary data (search results, directories, detail pages) must
 * let errors reach the route's error boundary instead of using this.
 *
 * Next.js signals such as `connection()` during prerendering, `notFound()` and
 * `redirect()` are thrown as errors; `unstable_rethrow` passes them through so
 * a catch here can never turn a request-time page back into a static one.
 */
export async function withFallback<T>(work: Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await work;
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[data] ${context} failed — rendering without it:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}
