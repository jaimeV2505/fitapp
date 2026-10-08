import type { PersistentQueue } from "./persistent-queue";

export type SyncStatus = "synced" | "saving" | "offline" | "error";

/**
 * How the engine should treat the result of one send:
 *  ok    - delivered; remove from the queue
 *  drop  - the server permanently rejected it; remove and surface a message
 *  retry - transient failure (offline, 5xx, rate limit); keep and retry with backoff
 *  halt  - cannot continue until the user acts (e.g. signed out); keep everything
 */
export type SendOutcome =
  | { kind: "ok" }
  | { kind: "drop"; message: string }
  | { kind: "retry" }
  | { kind: "halt"; message: string };

export interface SyncSnapshot<P> {
  status: SyncStatus;
  /** Payloads still waiting to be delivered, oldest first. Persisted across refreshes. */
  pending: readonly P[];
  lastError: string | null;
}

export interface SyncEngineOptions<P> {
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Called after a payload was delivered, before it leaves the queue. */
  onSent?: (payload: P) => void;
}

const EMPTY: SyncSnapshot<never> = { status: "synced", pending: [], lastError: null };

/**
 * Delivers queued mutations in order with automatic retry. UI code enqueues and reads the snapshot;
 * it never awaits the network. Replace the queue with IndexedDB / a service worker later without
 * changing callers.
 */
export class SyncEngine<P> {
  private snapshot: SyncSnapshot<P> = EMPTY;
  private readonly listeners = new Set<() => void>();
  private flushing: Promise<void> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;

  constructor(
    private readonly queue: PersistentQueue<P>,
    private readonly send: (payload: P) => Promise<SendOutcome>,
    private readonly options: SyncEngineOptions<P> = {},
  ) {}

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): SyncSnapshot<P> => this.snapshot;
  readonly getServerSnapshot = (): SyncSnapshot<P> => EMPTY;

  /** Load anything persisted by a previous page load and start delivering it. */
  start(): void {
    this.refreshPending();
    void this.flush();
  }

  enqueue(key: string, payload: P): void {
    this.queue.upsert(key, payload);
    this.update({ lastError: null });
    this.refreshPending();
    void this.flush();
  }

  flush(): Promise<void> {
    if (!this.flushing) {
      this.flushing = this.drain().finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  dispose(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private async drain(): Promise<void> {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;

    for (;;) {
      const item = this.queue.list()[0];
      if (!item) break;

      this.update({ status: "saving" });
      let outcome: SendOutcome;
      try {
        outcome = await this.send(item.payload);
      } catch {
        outcome = { kind: "retry" };
      }

      if (outcome.kind === "ok") {
        this.failures = 0;
        this.options.onSent?.(item.payload);
        this.queue.removeIfUnchanged(item.key, item.version);
        this.refreshPending();
        continue;
      }
      if (outcome.kind === "drop") {
        this.queue.removeIfUnchanged(item.key, item.version);
        this.update({ lastError: outcome.message });
        this.refreshPending();
        continue;
      }
      if (outcome.kind === "halt") {
        this.update({ status: "error", lastError: outcome.message });
        return;
      }
      this.queue.recordAttempt(item.key);
      this.update({ status: "offline" });
      this.scheduleRetry();
      return;
    }

    this.update({ status: this.snapshot.lastError ? "error" : "synced" });
  }

  private scheduleRetry(): void {
    const base = this.options.baseDelayMs ?? 2000;
    const max = this.options.maxDelayMs ?? 30000;
    const delay = Math.min(max, base * 2 ** this.failures);
    this.failures += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  private refreshPending(): void {
    this.update({ pending: this.queue.list().map((item) => item.payload) });
  }

  private update(partial: Partial<SyncSnapshot<P>>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const listener of this.listeners) listener();
  }
}
