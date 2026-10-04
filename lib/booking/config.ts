import type { SeatTier } from "@prisma/client";

/** Business rules for ticket booking, kept in one place. */

export const CITIES = ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad"] as const;
export type City = (typeof CITIES)[number];

/** How long seats stay reserved while the user pays. */
export const HOLD_MINUTES = 10;

export const MAX_SEATS_PER_BOOKING = 10;

/** Flat convenience fee per ticket, in paise (₹25). */
export const CONVENIENCE_FEE_PER_SEAT = 2500;

/** Online booking closes this many minutes before showtime. */
export const BOOKING_CUTOFF_MINUTES = 10;

export const TIER_LABELS: Record<SeatTier, string> = {
  RECLINER: "Recliner",
  PREMIUM: "Premium",
  REGULAR: "Regular",
};

/**
 * Seat layout shared by every screen, listed from the screen (front) to the back.
 * `aisleAfter` lists seat numbers that are followed by a walkway.
 */
export const SEAT_LAYOUT: { tier: SeatTier; rows: string[]; seatsPerRow: number; aisleAfter: number[] }[] = [
  { tier: "REGULAR", rows: ["A", "B", "C", "D"], seatsPerRow: 16, aisleAfter: [4, 12] },
  { tier: "PREMIUM", rows: ["E", "F", "G", "H", "I"], seatsPerRow: 16, aisleAfter: [4, 12] },
  { tier: "RECLINER", rows: ["J", "K"], seatsPerRow: 10, aisleAfter: [5] },
];

export const SEATS_PER_SCREEN = SEAT_LAYOUT.reduce((sum, t) => sum + t.rows.length * t.seatsPerRow, 0);
