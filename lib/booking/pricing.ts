import type { SeatTier } from "@prisma/client";
import { CONVENIENCE_FEE_PER_SEAT } from "./config";

export type TierPrices = Record<SeatTier, number>;

/** Prices for a show, keyed by seat tier (all amounts in paise). */
export function showPrices(show: { priceRecliner: number; pricePremium: number; priceRegular: number }): TierPrices {
  return { RECLINER: show.priceRecliner, PREMIUM: show.pricePremium, REGULAR: show.priceRegular };
}

/**
 * The single source of truth for what a booking costs. Always run on the
 * server, so a user can never change the amount they are charged.
 */
export function calculateTotals(tiers: SeatTier[], prices: TierPrices) {
  const subtotal = tiers.reduce((sum, tier) => sum + prices[tier], 0);
  const convenienceFee = tiers.length * CONVENIENCE_FEE_PER_SEAT;
  return { subtotal, convenienceFee, total: subtotal + convenienceFee };
}
