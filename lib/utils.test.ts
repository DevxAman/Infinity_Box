import { describe, expect, it } from "vitest";
import { formatINR, formatRuntime, istDateKey, istDayRange, safeNext, upcomingDays } from "./utils";

describe("safeNext (open-redirect protection)", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/bookings")).toBe("/bookings");
    expect(safeNext("/book/show/abc?x=1")).toBe("/book/show/abc?x=1");
  });

  it("blocks external and protocol-relative URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});

describe("formatting", () => {
  it("formats paise as rupees", () => {
    expect(formatINR(18000)).toBe("₹180");
    expect(formatINR(12345600)).toBe("₹1,23,456");
  });

  it("formats runtime", () => {
    expect(formatRuntime(135)).toBe("2h 15m");
    expect(formatRuntime(45)).toBe("45m");
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("IST dates", () => {
  it("uses the Indian calendar day, not UTC", () => {
    // 20:00 UTC is already 01:30 the next day in India.
    expect(istDateKey(new Date("2026-10-04T20:00:00Z"))).toBe("2026-10-05");
  });

  it("builds a 24h range starting at IST midnight", () => {
    const { start, end } = istDayRange("2026-10-05");
    expect(start.toISOString()).toBe("2026-10-04T18:30:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("lists upcoming days starting with Today", () => {
    const days = upcomingDays(7, new Date("2026-10-04T06:00:00Z"));
    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ key: "2026-10-04", weekday: "Today" });
    expect(days[1].weekday).toBe("Tomorrow");
  });
});
