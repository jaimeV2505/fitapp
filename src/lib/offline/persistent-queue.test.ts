import { describe, expect, it } from "vitest";
import { PersistentQueue, type StorageLike } from "./persistent-queue";

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("PersistentQueue", () => {
  it("replaces an item with the same key and bumps its version", () => {
    const queue = new PersistentQueue<{ reps: number }>("q", memoryStorage());
    const first = queue.upsert("set-1", { reps: 8 });
    const second = queue.upsert("set-1", { reps: 9 });
    expect(queue.size()).toBe(1);
    expect(second.version).toBe(first.version + 1);
    expect(queue.list()[0]?.payload).toEqual({ reps: 9 });
  });

  it("keeps a newer edit when an older send finishes (removeIfUnchanged)", () => {
    const queue = new PersistentQueue<{ reps: number }>("q", memoryStorage());
    const sent = queue.upsert("set-1", { reps: 8 });
    queue.upsert("set-1", { reps: 9 }); // user edited while the first request was in flight
    expect(queue.removeIfUnchanged("set-1", sent.version)).toBe(false);
    expect(queue.size()).toBe(1);
  });

  it("removes an unchanged item after a successful send", () => {
    const queue = new PersistentQueue<{ reps: number }>("q", memoryStorage());
    const item = queue.upsert("set-1", { reps: 8 });
    expect(queue.removeIfUnchanged("set-1", item.version)).toBe(true);
    expect(queue.size()).toBe(0);
  });

  it("survives a new instance over the same storage (page refresh)", () => {
    const storage = memoryStorage();
    new PersistentQueue<{ reps: number }>("q", storage).upsert("set-1", { reps: 8 });
    expect(new PersistentQueue<{ reps: number }>("q", storage).size()).toBe(1);
  });

  it("is a harmless no-op without storage", () => {
    const queue = new PersistentQueue<number>("q", null);
    queue.upsert("a", 1);
    expect(queue.size()).toBe(0);
  });
});
