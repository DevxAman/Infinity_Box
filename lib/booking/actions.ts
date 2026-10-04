"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureProfile, getUser } from "@/lib/auth";
import { createOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { BOOKING_CUTOFF_MINUTES, HOLD_MINUTES, MAX_SEATS_PER_BOOKING } from "./config";
import { generateBookingCode } from "./code";
import { calculateTotals, showPrices } from "./pricing";
import { confirmBooking, releaseBooking } from "./lifecycle";

type ActionResult = { error: string } | undefined;

const holdSchema = z.object({
  showId: z.string().min(1),
  seatIds: z.array(z.string().min(1)).min(1).max(MAX_SEATS_PER_BOOKING),
});

/**
 * Step 1 of checkout: reserve the chosen seats for HOLD_MINUTES and create a
 * Razorpay order for the server-calculated total.
 */
export async function holdSeats(input: z.infer<typeof holdSchema>): Promise<ActionResult> {
  const parsed = holdSchema.safeParse(input);
  if (!parsed.success) return { error: "Please select between 1 and 10 seats." };
  const { showId } = parsed.data;
  const seatIds = [...new Set(parsed.data.seatIds)];

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/book/show/${showId}`)}`);

  const show = await db.show.findUnique({ where: { id: showId } });
  if (!show || show.startsAt.getTime() < Date.now() + BOOKING_CUTOFF_MINUTES * 60 * 1000) {
    return { error: "Booking for this show has closed." };
  }

  const seats = await db.seat.findMany({ where: { id: { in: seatIds }, screenId: show.screenId } });
  if (seats.length !== seatIds.length) return { error: "Some of the selected seats don't exist." };

  // Price is computed here on the server, never trusted from the browser.
  const prices = showPrices(show);
  const totals = calculateTotals(
    seats.map((s) => s.tier),
    prices,
  );

  await ensureProfile(user);

  let booking;
  try {
    booking = await db.$transaction(async (tx) => {
      // Free seats from expired holds, and from this user's earlier unpaid
      // attempt for the same show (e.g. they went back to change seats).
      const stale = await tx.booking.findMany({
        where: { showId, status: "PENDING", OR: [{ holdExpiresAt: { lt: new Date() } }, { userId: user.id }] },
        select: { id: true },
      });
      if (stale.length > 0) {
        const ids = stale.map((b) => b.id);
        await tx.bookedSeat.deleteMany({ where: { bookingId: { in: ids } } });
        await tx.booking.updateMany({ where: { id: { in: ids } }, data: { status: "EXPIRED" } });
      }

      return tx.booking.create({
        data: {
          code: generateBookingCode(),
          userId: user.id,
          showId,
          ...totals,
          holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
          seats: { create: seats.map((s) => ({ seatId: s.id, showId, price: prices[s.tier] })) },
        },
      });
    });
  } catch (err) {
    // Unique (showId, seatId) violated: someone else grabbed a seat first.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Sorry, some of those seats were just booked by someone else. Please pick again." };
    }
    throw err;
  }

  try {
    const order = await createOrder({ amount: booking.total, receipt: booking.code, notes: { bookingId: booking.id } });
    await db.booking.update({ where: { id: booking.id }, data: { razorpayOrderId: order.id } });
  } catch (err) {
    console.error("[booking] could not create Razorpay order", err);
    await releaseBooking(booking.id, "FAILED");
    return { error: "We couldn't start the payment. Please try again." };
  }

  redirect(`/checkout/${booking.id}`);
}

const verifySchema = z.object({
  bookingId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Step 2: Razorpay Checkout succeeded in the browser; prove it really happened. */
export async function verifyPayment(input: z.infer<typeof verifySchema>): Promise<{ error?: string; status?: string }> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid payment response." };
  const p = parsed.data;

  const user = await getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const booking = await db.booking.findFirst({ where: { id: p.bookingId, userId: user.id } });
  if (!booking || booking.razorpayOrderId !== p.razorpay_order_id) {
    return { error: "We couldn't match this payment to your booking." };
  }

  if (!verifyPaymentSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
    return { error: "Payment verification failed." };
  }

  const result = await confirmBooking(booking.id, p.razorpay_payment_id);
  return { status: result.status };
}

/** Let the user give up their held seats right away. */
export async function cancelHold(bookingId: string) {
  const user = await getUser();
  if (!user) redirect("/login");

  const booking = await db.booking.findFirst({ where: { id: bookingId, userId: user.id, status: "PENDING" } });
  if (booking) await releaseBooking(booking.id, "CANCELLED");

  redirect(booking ? `/book/show/${booking.showId}` : "/bookings");
}
