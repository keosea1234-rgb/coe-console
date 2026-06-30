export const COVERAGE_RAMP: [number, string][] = [
  [0, '#d94f45'],
  [0.48, '#e85d4a'],
  [0.58, '#f59e0b'],
  [0.72, '#f6d365'],
  [0.78, '#f7e39a'],
  [0.84, '#9bd4a1'],
  [0.92, '#67bf8a'],
  [1, '#36a26d'],
];

export const coverageLegendGradient = `linear-gradient(90deg, ${COVERAGE_RAMP.map(
  ([stop, color]) => `${color} ${Math.round(stop * 100)}%`,
).join(', ')})`;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function coverageRgb(value: number): [number, number, number] {
  const x = clamp01(value);
  for (let i = 1; i < COVERAGE_RAMP.length; i++) {
    const [t1, c1] = COVERAGE_RAMP[i];
    const [t0, c0] = COVERAGE_RAMP[i - 1];
    if (x <= t1) {
      const k = (x - t0) / (t1 - t0);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    }
  }
  return hexToRgb(COVERAGE_RAMP[COVERAGE_RAMP.length - 1][1]);
}

export function coverageColor(value: number): string {
  const [r, g, b] = coverageRgb(value).map(Math.round) as [number, number, number];
  return `rgb(${r},${g},${b})`;
}

export function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
