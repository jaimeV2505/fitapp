/**
 * Object storage abstraction (food photos, later body photos).
 * Phase 2 adds `local` (development) and `vercel-blob` (production) adapters.
 * Application code depends only on this interface.
 */
export interface StoredObject {
  /** Opaque key used to read or delete the object later. */
  key: string;
  sizeBytes: number;
  contentType: string;
}

export interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StoredObject>;
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
