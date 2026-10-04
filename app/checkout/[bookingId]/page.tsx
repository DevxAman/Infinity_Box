import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { displayName, requireUser } from "@/lib/auth";
import { getBookingForUser } from "@/lib/booking/queries";
import CheckoutPanel from "@/components/booking/CheckoutPanel";
import OrderSummary from "@/components/booking/OrderSummary";
import Steps from "@/components/booking/Steps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireUser(`/checkout/${bookingId}`);

  const booking = await getBookingForUser(bookingId, user.id);
  if (!booking) notFound();
  if (booking.status === "CONFIRMED" || booking.status === "FAILED") redirect(`/bookings/${booking.id}`);

  const active = booking.status === "PENDING" && booking.holdExpiresAt > new Date() && booking.razorpayOrderId;

  return (
    <div className="px-4 pb-16 pt-28 sm:px-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <Steps current={3} />
        <h1 className="text-3xl font-black tracking-tight text-white">Review &amp; pay</h1>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <OrderSummary booking={booking} />
          {active ? (
            <CheckoutPanel
              bookingId={booking.id}
              orderId={booking.razorpayOrderId!}
              amount={booking.total}
              holdExpiresAt={booking.holdExpiresAt.toISOString()}
              showId={booking.showId}
              description={`${booking.show.movie.title} · ${booking.seats.length} ticket${booking.seats.length > 1 ? "s" : ""}`}
              customer={{ name: displayName(user), email: user.email ?? "" }}
            />
          ) : (
            <div className="card space-y-4 p-6 text-center">
              <p className="text-4xl">⏰</p>
              <h2 className="text-xl font-bold text-white">This seat hold has ended</h2>
              <p className="text-sm text-muted">The seats were released. You can pick them again if they&apos;re still free.</p>
              <Link href={`/book/show/${booking.showId}`} className="btn btn-primary w-full">
                Choose seats again
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
