import { del, get, put } from "@vercel/blob";
import type { PutObjectInput, StorageProvider, StoredObject } from "./types";

type Access = "public" | "private";

/** Keys remember how the object was stored: "public:<url>" or "private:<pathname>". */
const KEY = /^(public|private):([\s\S]+)$/;

/** A store is either public or private and the `access` of every call must match it. We learn which on first use. */
let knownAccess: Access = "public";

interface PrivateObject {
  stream: ReadableStream<Uint8Array>;
  blob?: { contentType?: string };
}

/**
 * Production adapter (Vercel Blob). Works with both kinds of store and both kinds of authentication: a static
 * read-write token when one is configured, otherwise the short-lived OIDC token Vercel gives the functions.
 * Photos are only ever served through our authenticated route, never linked from pages.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  constructor(private readonly token?: string) {}

  private auth(): { token?: string } {
    return this.token ? { token: this.token } : {};
  }

  private async putWith(access: Access, input: PutObjectInput): Promise<StoredObject> {
    const blob = await put(input.key, Buffer.from(input.body), {
      access,
      contentType: input.contentType,
      addRandomSuffix: true,
      ...this.auth(),
    });
    return { key: access === "public" ? `public:${blob.url}` : `private:${blob.pathname}`, sizeBytes: input.body.byteLength, contentType: input.contentType };
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const first = knownAccess;
    try {
      return await this.putWith(first, input);
    } catch (firstError) {
      // The usual failure here is asking for the wrong access mode for this store: try the other one once.
      const other: Access = first === "public" ? "private" : "public";
      try {
        const stored = await this.putWith(other, input);
        knownAccess = other;
        return stored;
      } catch {
        throw firstError;
      }
    }
  }

  async get(key: string): Promise<{ body: Uint8Array; contentType: string } | null> {
    const match = KEY.exec(key);
    if (!match) return null;
    const [, access, location] = match;

    if (access === "public") {
      const response = await fetch(location ?? "");
      if (!response.ok) return null;
      return { body: new Uint8Array(await response.arrayBuffer()), contentType: response.headers.get("content-type") ?? "application/octet-stream" };
    }

    const result = (await get(location ?? "", { access: "private", ...this.auth() })) as unknown as PrivateObject | null;
    if (!result) return null;
    return { body: new Uint8Array(await new Response(result.stream).arrayBuffer()), contentType: result.blob?.contentType ?? "application/octet-stream" };
  }

  async delete(key: string): Promise<void> {
    const match = KEY.exec(key);
    await del(match ? (match[2] ?? key) : key, this.auth());
  }
}
