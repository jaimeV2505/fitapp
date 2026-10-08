import { env } from "@/lib/env";
import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./types";
import { VercelBlobStorageProvider } from "./vercel-blob";

const globalForStorage = globalThis as unknown as { __storage?: StorageProvider };

/** The configured storage adapter (STORAGE_DRIVER). Application code only sees the StorageProvider interface. */
export function getStorage(): StorageProvider {
  if (globalForStorage.__storage) return globalForStorage.__storage;
  let provider: StorageProvider;
  if (env.STORAGE_DRIVER === "vercel-blob") {
    if (!env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required when STORAGE_DRIVER=vercel-blob");
    provider = new VercelBlobStorageProvider(env.BLOB_READ_WRITE_TOKEN);
  } else {
    provider = new LocalStorageProvider(env.LOCAL_STORAGE_DIR);
  }
  globalForStorage.__storage = provider;
  return provider;
}

export type { StorageProvider } from "./types";
