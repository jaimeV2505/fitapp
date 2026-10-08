export type CelebrationKind = "pr" | "finish";

const FINISH_COLORS = ["#f4c531", "#d7352b", "#2a5cc8", "#1c9658", "#f4f5fa"];
const PR_COLORS = ["#f4c531", "#f2b90f", "#fff3c4", "#f4f5fa"];

/**
 * Confetti, kept small and short. "pr" is one compact burst near the middle of the screen; "finish" is
 * a bigger burst plus two side cannons. Does nothing for people who prefer reduced motion or on the server.
 */
export async function fireCelebration(kind: CelebrationKind = "finish", origin: { x: number; y: number } = { x: 0.5, y: 0.35 }): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await import("canvas-confetti");

  if (kind === "pr") {
    confetti({ particleCount: 38, spread: 58, startVelocity: 32, ticks: 110, scalar: 0.85, gravity: 1.1, origin, colors: PR_COLORS, disableForReducedMotion: true });
    return;
  }

  confetti({ particleCount: 80, spread: 75, startVelocity: 38, origin, colors: FINISH_COLORS, disableForReducedMotion: true });
  window.setTimeout(() => {
    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 0.55 }, colors: FINISH_COLORS, disableForReducedMotion: true });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 0.55 }, colors: FINISH_COLORS, disableForReducedMotion: true });
  }, 200);
}
