export interface SparkPoint {
  x: number;
  y: number;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** Maps values onto a width x height box (y grows downwards, so higher values are nearer the top). */
export function sparklinePoints(values: readonly number[], width: number, height: number, pad = 2): SparkPoint[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  return values.map((value, index) => ({
    x: round(values.length === 1 ? width / 2 : pad + (index / (values.length - 1)) * innerWidth),
    y: round(span === 0 ? height / 2 : pad + (1 - (value - min) / span) * innerHeight),
  }));
}

export function sparklinePath(points: readonly SparkPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

export type TrendDirection = "up" | "flat" | "down";

/** Compares the latest value with the first one of the window. */
export function trendDirection(values: readonly number[]): TrendDirection {
  const first = values[0];
  const last = values[values.length - 1];
  if (first === undefined || last === undefined || last === first) return "flat";
  return last > first ? "up" : "down";
}
