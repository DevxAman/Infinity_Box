import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmBooking } from "@/lib/booking/lifecycle";

/**
 * Razorpay → our server, independent of the user's browser. If the user
 * closes the tab right after paying, this still confirms the booking.
 * Configure in Razorpay Dashboard → Webhooks with events: payment.captured.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: { payment?: { entity: { id: string; order_id: string } } };
  };

  const payment = event.payload.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment) {
    const booking = await db.booking.findUnique({ where: { razorpayOrderId: payment.order_id } });
    if (booking) await confirmBooking(booking.id, payment.id);
  }

  // Always 200 for valid events so Razorpay doesn't keep retrying.
  return NextResponse.json({ received: true });
}
