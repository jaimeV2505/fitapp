"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ActionResult } from "@/lib/actions";
import { PersistentQueue, type StorageLike } from "@/lib/offline/persistent-queue";
import { SyncEngine, type SendOutcome, type SyncSnapshot } from "@/lib/offline/sync-engine";
import { saveSetAction } from "../actions";
import type { SaveSetInput } from "../types";

function safeStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage blocked (some private modes)
  }
}

function toOutcome(result: ActionResult<unknown>): SendOutcome {
  if (result.ok) return { kind: "ok" };
  switch (result.code) {
    case "validation":
    case "not_found":
    case "conflict":
      return { kind: "drop", message: result.error };
    case "unauthenticated":
      return { kind: "halt", message: result.error };
    default:
      return { kind: "retry" }; // rate_limited, internal
  }
}

/**
 * Connects the workout logger to the sync engine. Sets are saved by enqueueing; the queue lives in
 * localStorage, so a refresh or a dead gym Wi-Fi never loses logged sets.
 * `onSent` runs when the server has confirmed a set.
 */
export function useSetSync(sessionId: string, onSent: (input: SaveSetInput) => void) {
  const [engine] = useState(
    () =>
      new SyncEngine<SaveSetInput>(
        new PersistentQueue<SaveSetInput>(`fitapp:pending-sets:${sessionId}`, safeStorage()),
        async (input) => toOutcome(await saveSetAction(input)),
        { onSent },
      ),
  );

  useEffect(() => {
    engine.start();
    const flush = () => void engine.flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (engine.getSnapshot().pending.length > 0) event.preventDefault();
    };
    window.addEventListener("online", flush);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisible);
      engine.dispose();
    };
  }, [engine]);

  const snapshot: SyncSnapshot<SaveSetInput> = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getServerSnapshot,
  );

  return { engine, snapshot };
}
