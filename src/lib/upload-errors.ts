/**
 * User-facing messages for vehicle-photo upload failures. Safe for client and
 * server: only fixed strings are returned — never response bodies, database
 * errors, storage paths or tokens.
 */

/** Why the server could not issue a signed upload URL (diagnosed after the fact). */
export type UploadStartFailure = "listing_suspended" | "folder_full" | "not_permitted" | "unavailable";

export const UPLOAD_START_MESSAGES: Record<UploadStartFailure, string> = {
  listing_suspended: "This listing is suspended, so photos can't be added. Contact support for help.",
  folder_full:
    "This listing has reached its storage limit, usually because of earlier uploads that didn't finish. Contact support for help.",
  not_permitted: "You don't have permission to add photos to this listing.",
  unavailable: "We couldn't start the upload. Please try again in a moment.",
};

/** Storage service objects allowed per listing folder (mirrors the upload policy in migration …0300). */
export const MAX_OBJECTS_PER_LISTING_FOLDER = 30;

/**
 * Classifies a failed signed-URL request. Listing/folder facts are checked
 * first because they explain a refusal precisely; otherwise a permission
 * refusal and an outage are told apart by the error's status/text.
 */
export function classifyUploadStartFailure(input: {
  listingStatus: string | null;
  folderObjectCount: number | null;
  error: { message?: string; status?: number; statusCode?: string | number } | null;
}): UploadStartFailure {
  if (input.listingStatus === "suspended") return "listing_suspended";
  if (input.folderObjectCount !== null && input.folderObjectCount >= MAX_OBJECTS_PER_LISTING_FOLDER) return "folder_full";
  const status = Number(input.error?.status ?? input.error?.statusCode);
  const text = (input.error?.message ?? "").toLowerCase();
  if (status === 401 || status === 403 || text.includes("row-level security") || text.includes("unauthorized")) return "not_permitted";
  return "unavailable";
}

/** Message for a failed direct upload (browser → signed URL). `status` 0 = network failure. */
export function uploadTransferMessage(status: number, maxMegabytes: number): string {
  if (status === 0) return "The connection was interrupted during the upload. Check your connection and try again.";
  if (status === 413) return `This photo is too large. The maximum is ${maxMegabytes} MB.`;
  if (status === 415) return "This file type isn't supported. Use JPEG, PNG, WebP or AVIF.";
  if (status === 401 || status === 403) return "The upload link expired or was refused. Please try again.";
  if (status === 409) return "This photo was already uploaded. Please try again.";
  if (status === 429) return "Too many uploads in a short time. Please wait a moment and try again.";
  if (status === 400) return "The photo was rejected. Check that it's a JPEG, PNG, WebP or AVIF image under the size limit.";
  if (status >= 500) return "The photo service is temporarily unavailable. Please try again shortly.";
  return "The upload failed. Please try again.";
}
