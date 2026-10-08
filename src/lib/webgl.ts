let cached: boolean | undefined;

/** Whether this browser can draw WebGL (needed for the 3D body). The answer is computed once. */
export function supportsWebGL(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement("canvas");
    cached = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    cached = false;
  }
  return cached;
}

/** For useSyncExternalStore: the answer never changes, so there is nothing to subscribe to. */
export const subscribeNever = (): (() => void) => () => undefined;
