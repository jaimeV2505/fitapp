import { env } from "@/lib/env";
import { storageReady } from "./config";
import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";
import { VercelBlobStorageProvider } from "./vercel-blob";

const globalForStorage = globalThis as unknown as { __storage?: StorageProvider };

/** False when STORAGE_DRIVER=vercel-blob but no Blob store is connected (neither a token nor a store id). */
export function isStorageConfigured(): boolean {
  return storageReady(env.STORAGE_DRIVER, env.BLOB_READ_WRITE_TOKEN, env.BLOB_STORE_ID);
}

/** The configured storage adapter (STORAGE_DRIVER). Application code only sees the StorageProvider interface. */
export function getStorage(): StorageProvider {
  if (globalForStorage.__storage) return globalForStorage.__storage;
  let provider: StorageProvider;
  if (env.STORAGE_DRIVER === "vercel-blob") {
    if (!isStorageConfigured()) throw new Error("Vercel Blob is not connected: neither BLOB_STORE_ID nor BLOB_READ_WRITE_TOKEN is set");
    // Without a token the SDK authenticates with the OIDC token Vercel gives the functions.
    provider = new VercelBlobStorageProvider(env.BLOB_READ_WRITE_TOKEN?.trim() || undefined);
  } else {
    provider = new LocalStorageProvider(env.LOCAL_STORAGE_DIR);
  }
  globalForStorage.__storage = provider;
  return provider;
}

export type { StorageProvider } from "./types";
