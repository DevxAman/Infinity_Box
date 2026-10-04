import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getBookingForUser } from "@/lib/booking/queries";
import { TIER_LABELS } from "@/lib/booking/config";
import { formatDateLong, formatINR, formatTime, imageUrl } from "@/lib/utils";
import Celebrate from "@/components/booking/Celebrate";
import PrintButton from "@/components/booking/PrintButton";
import Steps from "@/components/booking/Steps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };

const FORMAT_LABELS = { TWO_D: "2D", THREE_D: "3D", IMAX: "IMAX" } as const;

interface Props {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function TicketPage({ params, searchParams }: Props) {
  const [{ bookingId }, { new: isNew }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/bookings/${bookingId}`);

  const booking = await getBookingForUser(bookingId, user.id);
  if (!booking) notFound();
  if (booking.status === "PENDING") redirect(`/checkout/${booking.id}`);

  if (booking.status !== "CONFIRMED") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-16">
        <div className="card max-w-md space-y-4 p-8 text-center">
          <p className="text-4xl">💸</p>
          <h1 className="text-2xl font-bold text-white">Payment refunded</h1>
          <p className="text-muted">
            Your payment came through after the seat hold expired, so those seats couldn&apos;t be guaranteed. A full refund of{" "}
            <b className="text-white">{formatINR(booking.total)}</b> has been initiated to your original payment method.
          </p>
          <Link href={`/book/show/${booking.showId}`} className="btn btn-primary w-full">
            Try booking again
          </Link>
        </div>
      </div>
    );
  }

  const { show } = booking;
  // In production this would be a signed token checked at the gate.
  const qr = await QRCode.toDataURL(`INFINITYBOX:${booking.code}`, { margin: 1, width: 320 });
  const seatsByTier = Object.entries(
    booking.seats.reduce<Record<string, string[]>>((acc, s) => {
      (acc[TIER_LABELS[s.seat.tier]] ??= []).push(`${s.seat.row}${s.seat.number}`);
      return acc;
    }, {}),
  );

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-12">
      {isNew && <Celebrate />}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 blur-[100px]" />

      <div className="relative mx-auto max-w-md space-y-8">
        <div className="no-print flex justify-center">
          <Steps current={4} />
        </div>

        <div className="text-center">
          <p className="mb-2 text-sm font-semibold tracking-widest text-emerald-400 uppercase">✓ Booking confirmed</p>
          <h1 className="text-3xl font-black tracking-tight text-white">You&apos;re going to the movies!</h1>
        </div>

        {/* The ticket */}
        <article className="overflow-hidden rounded-3xl bg-white text-zinc-900 shadow-2xl shadow-brand/20">
          <div className="relative h-40">
            {show.movie.backdropPath && (
              <Image src={imageUrl(show.movie.backdropPath, "w780")!} alt="" fill sizes="448px" className="object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="text-2xl font-black text-white">{show.movie.title}</h2>
              <p className="text-sm text-zinc-200">
                {show.language} · {FORMAT_LABELS[show.format]}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-6 text-sm">
            <div className="col-span-2">
              <dt className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Theater</dt>
              <dd className="font-bold">{show.screen.theater.name}</dd>
              <dd className="text-xs text-zinc-500">{show.screen.theater.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Date</dt>
              <dd className="font-bold">{formatDateLong(show.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Time</dt>
              <dd className="text-xl font-black">{formatTime(show.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Screen</dt>
              <dd className="font-bold">{show.screen.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Seats</dt>
              {seatsByTier.map(([tier, seats]) => (
                <dd key={tier} className="font-bold">
                  {seats.join(", ")} <span className="text-xs font-normal text-zinc-500">({tier})</span>
                </dd>
              ))}
            </div>
          </dl>

          {/* Perforation */}
          <div className="relative flex items-center" aria-hidden>
            <span className="absolute -left-4 h-8 w-8 rounded-full bg-background" />
            <span className="mx-6 w-full border-t-2 border-dashed border-zinc-300" />
            <span className="absolute -right-4 h-8 w-8 rounded-full bg-background" />
          </div>

          <div className="flex items-center gap-5 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated on the server */}
            <img src={qr} alt={`QR code for booking ${booking.code}`} className="h-28 w-28 flex-none rounded-lg" />
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Booking ID</p>
              <p className="font-mono text-xl font-black tracking-wider">{booking.code}</p>
              <p className="text-sm text-zinc-600">
                {booking.seats.length} ticket{booking.seats.length > 1 ? "s" : ""} · Paid {formatINR(booking.total)}
              </p>
              <p className="text-xs text-zinc-500">Show this QR at the entrance</p>
            </div>
          </div>
        </article>

        <div className="no-print flex flex-wrap justify-center gap-3">
          <PrintButton />
          <Link href="/bookings" className="btn btn-glass">
            All my bookings
          </Link>
          <Link href="/tickets" className="btn btn-primary">
            Book another
          </Link>
        </div>
      </div>
    </div>
  );
}
