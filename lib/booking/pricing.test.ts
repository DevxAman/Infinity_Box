import { describe, expect, it } from "vitest";
import { calculateTotals, showPrices } from "./pricing";
import { CONVENIENCE_FEE_PER_SEAT, SEAT_LAYOUT, SEATS_PER_SCREEN } from "./config";

const prices = showPrices({ priceRecliner: 45000, pricePremium: 25000, priceRegular: 18000 });

describe("calculateTotals", () => {
  it("adds seat prices and a per-seat convenience fee", () => {
    const totals = calculateTotals(["PREMIUM", "PREMIUM", "RECLINER"], prices);
    expect(totals.subtotal).toBe(25000 + 25000 + 45000);
    expect(totals.convenienceFee).toBe(3 * CONVENIENCE_FEE_PER_SEAT);
    expect(totals.total).toBe(totals.subtotal + totals.convenienceFee);
  });

  it("returns zero for no seats", () => {
    expect(calculateTotals([], prices)).toEqual({ subtotal: 0, convenienceFee: 0, total: 0 });
  });

  it("works in whole paise (no floating point money)", () => {
    const { total } = calculateTotals(["REGULAR", "REGULAR", "REGULAR"], prices);
    expect(Number.isInteger(total)).toBe(true);
  });
});

describe("seat layout", () => {
  it("has unique row letters across tiers", () => {
    const rows = SEAT_LAYOUT.flatMap((t) => t.rows);
    expect(new Set(rows).size).toBe(rows.length);
  });

  it("counts every seat in a screen", () => {
    expect(SEATS_PER_SCREEN).toBe(4 * 16 + 5 * 16 + 2 * 10);
  });
});
