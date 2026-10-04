import Image from "next/image";
import type { BookingWithDetails } from "@/lib/booking/queries";
import { TIER_LABELS } from "@/lib/booking/config";
import { formatDate, formatINR, formatTime, imageUrl } from "@/lib/utils";

const FORMAT_LABELS = { TWO_D: "2D", THREE_D: "3D", IMAX: "IMAX" } as const;

export default function OrderSummary({ booking }: { booking: BookingWithDetails }) {
  const { show } = booking;
  const seatLabels = booking.seats.map((s) => `${s.seat.row}${s.seat.number}`).join(", ");
  const tiers = [...new Set(booking.seats.map((s) => TIER_LABELS[s.seat.tier]))].join(" + ");

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 border-b border-line p-5">
        {show.movie.posterPath && (
          <div className="relative aspect-[2/3] w-20 flex-none overflow-hidden rounded-lg">
            <Image src={imageUrl(show.movie.posterPath, "w185")!} alt="" fill sizes="80px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-bold text-white">{show.movie.title}</h2>
          <p className="text-sm text-muted">
            {show.language} · {FORMAT_LABELS[show.format]}
          </p>
          <p className="text-sm text-zinc-300">{show.screen.theater.name}</p>
          <p className="text-sm font-semibold text-white">
            {formatDate(show.startsAt)} · {formatTime(show.startsAt)}
          </p>
        </div>
      </div>

      <dl className="space-y-3 p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">
            {booking.seats.length} × {tiers}
          </dt>
          <dd className="text-right font-medium text-white">{seatLabels}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Screen</dt>
          <dd className="text-white">{show.screen.name}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3">
          <dt className="text-muted">Tickets</dt>
          <dd className="text-white">{formatINR(booking.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Convenience fee</dt>
          <dd className="text-white">{formatINR(booking.convenienceFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="font-semibold text-white">Total</dt>
          <dd className="text-xl font-black text-white">{formatINR(booking.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
