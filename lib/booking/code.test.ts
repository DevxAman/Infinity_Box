import { describe, expect, it } from "vitest";
import { generateBookingCode } from "./code";

describe("generateBookingCode", () => {
  it("looks like IBX-XXXXXX with no ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateBookingCode()).toMatch(/^IBX-[2-9A-HJKMNP-Z]{6}$/);
    }
  });

  it("is practically unique", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateBookingCode));
    expect(codes.size).toBe(1000);
  });
});
