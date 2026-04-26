import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("converts YYYY-MM-DD to DD.MM.YYYY", () => {
    expect(formatDate("2026-04-10")).toBe("10.04.2026");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatDate("")).toBe("");
  });
});
