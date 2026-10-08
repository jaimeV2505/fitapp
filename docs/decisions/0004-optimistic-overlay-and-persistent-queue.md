# 0004 Optimistic overlay with a persistent sync queue

Status: accepted (2026-10-08)

## Context
Gym Wi-Fi is unreliable; a set must never be lost and logging must feel instant.

## Decision
The logger renders `confirmed state + queued sets`. Completing a set enqueues the full state of that set in a localStorage-backed queue keyed by set id; `SyncEngine` delivers it through an idempotent server action with backoff, and on reconnect/focus. Server confirmation moves the set into the confirmed state.

## Consequences
- Instant UI, survives refresh and offline periods, retries are safe (idempotent by set id, last write wins).
- Finish waits for the queue to drain.
- Extra-set add/remove needs a connection in the MVP.
- Phase 4 can replace storage with IndexedDB and drive `flush` from a service worker without touching UI code.
