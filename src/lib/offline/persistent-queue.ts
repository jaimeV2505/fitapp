/**
 * A tiny durable queue backed by localStorage (or any Storage-like object).
 * Items are keyed: enqueueing the same key replaces the previous payload (last write wins),
 * which is exactly what "save the current state of set X" needs.
 * Framework-free so it can later be swapped for IndexedDB / a service-worker sync queue.
 */

export interface QueueItem<T> {
  key: string;
  payload: T;
  /** Monotonic marker; changes whenever the payload is replaced. */
  version: number;
  attempts: number;
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class PersistentQueue<T> {
  constructor(
    private readonly storageKey: string,
    private readonly storage: StorageLike | null,
  ) {}

  list(): QueueItem<T>[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QueueItem<T>[]) : [];
    } catch {
      return [];
    }
  }

  size(): number {
    return this.list().length;
  }

  /** Adds or replaces the item with this key. Returns the stored item (with its new version). */
  upsert(key: string, payload: T): QueueItem<T> {
    const items = this.list();
    const previous = items.find((item) => item.key === key);
    const next: QueueItem<T> = { key, payload, version: (previous?.version ?? 0) + 1, attempts: 0 };
    this.write([...items.filter((item) => item.key !== key), next]);
    return next;
  }

  /**
   * Removes the item only if it has not been replaced since it was read.
   * Prevents deleting a newer edit that arrived while the older one was being sent.
   */
  removeIfUnchanged(key: string, version: number): boolean {
    const items = this.list();
    const current = items.find((item) => item.key === key);
    if (!current || current.version !== version) return false;
    this.write(items.filter((item) => item.key !== key));
    return true;
  }

  recordAttempt(key: string): void {
    this.write(this.list().map((item) => (item.key === key ? { ...item, attempts: item.attempts + 1 } : item)));
  }

  clear(): void {
    this.write([]);
  }

  private write(items: QueueItem<T>[]): void {
    if (!this.storage) return;
    try {
      if (items.length === 0) this.storage.removeItem(this.storageKey);
      else this.storage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // Storage full or unavailable (private mode). The in-flight request still proceeds.
    }
  }
}
