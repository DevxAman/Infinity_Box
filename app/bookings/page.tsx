import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserBookings, type BookingWithDetails } from "@/lib/booking/queries";
import { formatDate, formatINR, formatTime, imageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Bookings", robots: { index: false } };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await requireUser("/bookings");
  const bookings = await getUserBookings(user.id);

  const now = new Date();
  const showPast = tab === "past";
  const upcoming = bookings.filter((b) => b.show.startsAt >= now);
  const past = bookings.filter((b) => b.show.startsAt < now).reverse();
  const list = showPast ? past : upcoming;

  return (
    <div className="min-h-[80vh] px-4 pb-16 pt-28 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">My Bookings</h1>

        <nav className="mt-6 flex gap-2" aria-label="Booking tabs">
          <Link href="/bookings" className={`btn px-5 py-2 ${!showPast ? "btn-light" : "btn-glass"}`}>
            Upcoming ({upcoming.length})
          </Link>
          <Link href="/bookings?tab=past" className={`btn px-5 py-2 ${showPast ? "btn-light" : "btn-glass"}`}>
            Past ({past.length})
          </Link>
        </nav>

        {list.length === 0 ? (
          <div className="card mt-8 flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-5xl">🎬</p>
            <p className="text-lg font-semibold text-white">{showPast ? "No past bookings yet" : "No upcoming shows"}</p>
            <p className="text-muted">Grab some popcorn and book your next movie night.</p>
            <Link href="/tickets" className="btn btn-primary">
              Browse movies in theaters
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {list.map((booking) => (
              <li key={booking.id}>
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-500/15 text-emerald-400" },
  PENDING: { label: "Payment pending", className: "bg-amber-500/15 text-amber-400" },
  FAILED: { label: "Refunded", className: "bg-zinc-500/15 text-zinc-400" },
} as const;

function BookingCard({ booking }: { booking: BookingWithDetails }) {
  const { show } = booking;
  const status = STATUS_STYLES[booking.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.FAILED;
  const href = booking.status === "PENDING" ? `/checkout/${booking.id}` : `/bookings/${booking.id}`;

  return (
    <Link href={href} className="card group flex gap-4 p-4 transition hover:border-white/20 hover:bg-surface-2 sm:gap-6 sm:p-5">
      {show.movie.posterPath && (
        <div className="relative aspect-[2/3] w-20 flex-none overflow-hidden rounded-lg sm:w-24">
          <Image src={imageUrl(show.movie.posterPath, "w185")!} alt="" fill sizes="96px" className="object-cover" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">{show.movie.title}</h2>
            <p className="truncate text-sm text-muted">{show.screen.theater.name}</p>
          </div>
          <span className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-300">
          <span>📅 {formatDate(show.startsAt)}</span>
          <span>🕒 {formatTime(show.startsAt)}</span>
          <span>💺 {booking.seats.map((s) => `${s.seat.row}${s.seat.number}`).join(", ")}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-xs text-zinc-500">{booking.code}</span>
          <span className="font-semibold text-white">{formatINR(booking.total)}</span>
        </div>
      </div>
    </Link>
  );
}
