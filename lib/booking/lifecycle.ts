import "server-only";
import type { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { refundPayment } from "@/lib/razorpay";

/**
 * Booking state transitions live here so the checkout callback, the webhook
 * and the cancel button all follow exactly the same rules.
 *
 *   PENDING ──pay──▶ CONFIRMED
 *      │
 *      ├──timeout / replaced──▶ EXPIRED
 *      ├──user cancels──────▶ CANCELLED
 *      └──paid too late─────▶ FAILED (refunded)
 */

/** Free the seats of an unpaid booking. */
export async function releaseBooking(bookingId: string, status: Extract<BookingStatus, "EXPIRED" | "CANCELLED" | "FAILED">) {
  await db.$transaction([
    db.bookedSeat.deleteMany({ where: { bookingId, booking: { status: "PENDING" } } }),
    db.booking.updateMany({ where: { id: bookingId, status: "PENDING" }, data: { status } }),
  ]);
}

/**
 * Mark a booking as paid. Safe to call twice (checkout callback + webhook):
 * only a PENDING booking can move to CONFIRMED, and that update is atomic.
 */
export async function confirmBooking(bookingId: string, paymentId: string) {
  const { count } = await db.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CONFIRMED", razorpayPaymentId: paymentId, paidAt: new Date() },
  });

  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });

  // Payment arrived after the seats were released (hold expired or cancelled).
  // The seats may already belong to someone else, so refund instead.
  if (count === 0 && booking.status !== "CONFIRMED" && !booking.razorpayPaymentId) {
    await db.booking.update({ where: { id: bookingId }, data: { status: "FAILED", razorpayPaymentId: paymentId } });
    await refundPayment(paymentId).catch((err) => console.error("[booking] refund failed", err));
    return { ...booking, status: "FAILED" as const };
  }

  return booking;
}
