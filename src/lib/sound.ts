/**
 * Optional, very soft "clack" of a plate when a set is completed. Synthesised with the Web Audio API, so there
 * are no audio files to load. Off by default; the choice lives in this browser only.
 */
const KEY = "fitapp-sound";

let context: AudioContext | null = null;
const listeners = new Set<() => void>();

/** For useSyncExternalStore: the preference lives outside React, so React subscribes to it. */
export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function isSoundEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener());
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

/** A short low thump plus a brief metallic tick, around 0.12 s and quiet. Does nothing unless enabled. */
export function playClack(): void {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);

  // low thump
  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(150, now);
  thump.frequency.exponentialRampToValueAtTime(55, now + 0.1);
  thumpGain.gain.setValueAtTime(1, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thump.connect(thumpGain).connect(master);
  thump.start(now);
  thump.stop(now + 0.13);

  // metallic tick: a few milliseconds of high-passed noise
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const tick = ctx.createBufferSource();
  const highpass = ctx.createBiquadFilter();
  const tickGain = ctx.createGain();
  tick.buffer = buffer;
  highpass.type = "highpass";
  highpass.frequency.value = 2500;
  tickGain.gain.value = 0.5;
  tick.connect(highpass).connect(tickGain).connect(master);
  tick.start(now);
}
