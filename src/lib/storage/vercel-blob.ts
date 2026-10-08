import { del, put } from "@vercel/blob";
import type { PutObjectInput, StorageProvider, StoredObject } from "./types";

/**
 * Production adapter. The storage key is the blob URL. Objects are stored with an unguessable URL and
 * are only ever served through our authenticated route, never linked from pages.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private readonly token: string) {}

  async put(input: PutObjectInput): Promise<StoredObject> {
    const blob = await put(input.key, Buffer.from(input.body), {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: true,
      token: this.token,
    });
    return { key: blob.url, sizeBytes: input.body.byteLength, contentType: input.contentType };
  }

  async get(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
    const response = await fetch(key);
    if (!response.ok) return null;
    return { body: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get("content-type") ?? "application/octet-stream" };
  }

  async delete(key: string): Promise<void> {
    await del(key, { token: this.token });
  }
}
