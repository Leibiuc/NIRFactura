import { parseDecimal, snapStep } from "@/lib/number-step";

// step/min match how NumberInput drives the NIR cells (0.5 step, clamp at 0).
const up = (v: number) => snapStep(v, 1, 0.5, 0);
const down = (v: number) => snapStep(v, -1, 0.5, 0);

describe("snapStep (0.5 step, min 0)", () => {
  it("snaps an irregular fraction to the grid in the pressed direction", () => {
    // The user's literal example: 0.28 → up 0.5, down 0.0.
    expect(up(0.28)).toBe(0.5);
    expect(down(0.28)).toBe(0);
  });

  it("moves a full step from an on-grid value", () => {
    expect(up(0.5)).toBe(1);
    expect(down(0.5)).toBe(0);
    expect(up(21)).toBe(21.5); // VAT-style integer
    expect(down(21)).toBe(20.5);
    expect(up(5)).toBe(5.5);
  });

  it("snaps a mid-grid fraction to the nearest 0.5 on either side", () => {
    expect(up(0.75)).toBe(1);
    expect(down(0.75)).toBe(0.5);
  });

  it("never goes below the minimum", () => {
    expect(down(0)).toBe(0);
    expect(down(0.3)).toBe(0);
  });

  it("is robust to floating-point dust on the grid test", () => {
    expect(up(0.1 + 0.2)).toBe(0.5); // 0.30000000000000004 → up 0.5
  });
});

describe("parseDecimal", () => {
  it("accepts a dot as the decimal separator", () => {
    expect(parseDecimal("0.28")).toBe(0.28);
  });

  it("accepts a comma as the decimal separator", () => {
    expect(parseDecimal("0,28")).toBe(0.28);
  });

  it("returns undefined for non-numeric input", () => {
    expect(parseDecimal("")).toBeUndefined();
    expect(parseDecimal("abc")).toBeUndefined();
  });
});
