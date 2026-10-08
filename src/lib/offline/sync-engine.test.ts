import { describe, expect, it } from "vitest";
import { PersistentQueue, type StorageLike } from "./persistent-queue";
import { SyncEngine, type SendOutcome } from "./sync-engine";

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const makeEngine = (send: (p: number) => Promise<SendOutcome>, sent: number[] = []) =>
  new SyncEngine<number>(new PersistentQueue<number>("q", memoryStorage()), send, {
    baseDelayMs: 60_000,
    onSent: (p) => sent.push(p),
  });

describe("SyncEngine", () => {
  it("delivers queued items in order and ends synced", async () => {
    const delivered: number[] = [];
    const engine = makeEngine(async (p) => {
      delivered.push(p);
      return { kind: "ok" };
    });
    engine.enqueue("a", 1);
    engine.enqueue("b", 2);
    await engine.flush();
    expect(delivered).toEqual([1, 2]);
    expect(engine.getSnapshot().status).toBe("synced");
    expect(engine.getSnapshot().pending).toHaveLength(0);
    engine.dispose();
  });

  it("keeps items when offline and delivers them on the next flush", async () => {
    let online = false;
    const engine = makeEngine(async () => (online ? { kind: "ok" } : { kind: "retry" }));
    engine.enqueue("a", 1);
    await engine.flush();
    expect(engine.getSnapshot().status).toBe("offline");
    expect(engine.getSnapshot().pending).toEqual([1]);

    online = true;
    await engine.flush();
    expect(engine.getSnapshot().status).toBe("synced");
    expect(engine.getSnapshot().pending).toHaveLength(0);
    engine.dispose();
  });

  it("treats a thrown network error as retryable", async () => {
    const engine = makeEngine(async () => {
      throw new Error("Failed to fetch");
    });
    engine.enqueue("a", 1);
    await engine.flush();
    expect(engine.getSnapshot().status).toBe("offline");
    expect(engine.getSnapshot().pending).toEqual([1]);
    engine.dispose();
  });

  it("drops permanently rejected items and reports the message", async () => {
    const engine = makeEngine(async () => ({ kind: "drop", message: "This set can no longer be edited." }));
    engine.enqueue("a", 1);
    await engine.flush();
    expect(engine.getSnapshot().pending).toHaveLength(0);
    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().lastError).toBe("This set can no longer be edited.");
    engine.dispose();
  });

  it("halts without losing data when the user is signed out", async () => {
    const engine = makeEngine(async () => ({ kind: "halt", message: "Signed out" }));
    engine.enqueue("a", 1);
    await engine.flush();
    expect(engine.getSnapshot().status).toBe("error");
    expect(engine.getSnapshot().pending).toEqual([1]);
    engine.dispose();
  });

  it("does not lose an edit made while the previous version was being sent", async () => {
    const control: { release: (() => void) | null } = { release: null };
    const delivered: number[] = [];
    const engine = makeEngine(
      (p) =>
        new Promise<SendOutcome>((resolve) => {
          delivered.push(p);
          control.release = () => resolve({ kind: "ok" });
        }),
    );
    engine.enqueue("set-1", 8);
    // first send is in flight; user changes the same set
    engine.enqueue("set-1", 9);
    control.release?.();
    await new Promise((r) => setTimeout(r, 0));
    control.release?.();
    await engine.flush();
    expect(delivered).toEqual([8, 9]);
    expect(engine.getSnapshot().pending).toHaveLength(0);
    engine.dispose();
  });
});
