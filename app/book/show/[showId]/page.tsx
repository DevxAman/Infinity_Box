import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getShowForSeatPicker } from "@/lib/booking/queries";
import { showPrices } from "@/lib/booking/pricing";
import { formatDate, formatTime } from "@/lib/utils";
import MovieBanner from "@/components/booking/MovieBanner";
import SeatPicker from "@/components/booking/SeatPicker";
import Steps from "@/components/booking/Steps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Select seats", robots: { index: false } };

const FORMAT_LABELS = { TWO_D: "2D", THREE_D: "3D", IMAX: "IMAX" } as const;

export default async function SeatSelectionPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  const user = await requireUser(`/book/show/${showId}`);

  const data = await getShowForSeatPicker(showId, user.id);
  if (!data) notFound();
  const { show, takenSeatIds } = data;
  const isOver = show.startsAt < new Date();

  return (
    <div>
      <MovieBanner movie={show.movie}>
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-white">{show.screen.theater.name}</span> · {show.screen.name}
        </p>
        <p className="text-sm text-zinc-300">
          {formatDate(show.startsAt)} · <span className="font-semibold text-white">{formatTime(show.startsAt)}</span> ·{" "}
          {FORMAT_LABELS[show.format]} · {show.language}
        </p>
      </MovieBanner>

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-12">
        <Steps current={2} />
        <Link href={`/book/${show.movieId}?city=${encodeURIComponent(show.screen.theater.city)}`} className="btn btn-ghost px-4 py-2">
          ← Change showtime
        </Link>
      </div>

      {isOver ? (
        <div className="card mx-4 p-10 text-center sm:mx-12">
          <p className="text-lg font-semibold text-white">This show has already started</p>
          <Link href={`/book/${show.movieId}`} className="btn btn-primary mt-6">
            See other showtimes
          </Link>
        </div>
      ) : (
        <SeatPicker
          showId={show.id}
          seats={show.screen.seats.map(({ id, row, number, tier }) => ({ id, row, number, tier }))}
          takenSeatIds={takenSeatIds}
          prices={showPrices(show)}
        />
      )}
    </div>
  );
}
