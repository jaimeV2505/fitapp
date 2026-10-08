/**
 * Whether the chosen storage driver has what it needs to work. A pure check, so it can be tested.
 * Vercel Blob authenticates either with a static token (BLOB_READ_WRITE_TOKEN, older stores) or, on current stores,
 * with a short-lived OIDC token that Vercel provides to the functions; then only BLOB_STORE_ID is set.
 */
export function storageReady(driver: string, blobToken: string | undefined, blobStoreId?: string): boolean {
  if (driver !== "vercel-blob") return true;
  return Boolean(blobToken?.trim() || blobStoreId?.trim());
}
