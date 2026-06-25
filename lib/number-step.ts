/** Tolerance for "is this value on the 0.5 grid?" tests (floating-point dust). */
export const STEP_EPS = 1e-9;

/** Parse a user string, accepting both "." and "," as the decimal separator. */
export function parseDecimal(s: string): number | undefined {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Step `v` by `step` in direction `dir`, snapping irregular fractions to the
 * grid first: an off-grid value (e.g. 0.28 with step 0.5) jumps to the nearest
 * grid value in the pressed direction (up → 0.5, down → 0.0); an on-grid value
 * moves a full step. Never goes below `min`.
 */
export function snapStep(v: number, dir: 1 | -1, step: number, min: number): number {
  const onGrid = Math.abs(v / step - Math.round(v / step)) < STEP_EPS;
  const next = onGrid
    ? v + dir * step
    : dir > 0
    ? Math.ceil(v / step) * step
    : Math.floor(v / step) * step;
  return Math.round(Math.max(next, min) * 1e6) / 1e6;
}
