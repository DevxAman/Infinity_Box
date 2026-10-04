import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, SEATS_PER_SCREEN, type City } from "@/lib/booking/config";
import { getMovie, getShowtimes, type ShowSlot } from "@/lib/booking/queries";
import { formatINR, formatTime, upcomingDays } from "@/lib/utils";
import MovieBanner from "@/components/booking/MovieBanner";
import Steps from "@/components/booking/Steps";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ movieId: string }>;
  searchParams: Promise<{ city?: string; date?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { movieId } = await params;
  const movie = /^\d+$/.test(movieId) ? await getMovie(Number(movieId)) : null;
  return { title: movie ? `Book tickets: ${movie.title}` : "Book tickets" };
}

const FORMAT_LABELS = { TWO_D: "2D", THREE_D: "3D", IMAX: "IMAX" } as const;

export default async function ShowtimesPage({ params, searchParams }: Props) {
  const [{ movieId }, query] = await Promise.all([params, searchParams]);
  if (!/^\d+$/.test(movieId)) notFound();
  const movie = await getMovie(Number(movieId));
  if (!movie) notFound();

  const city: City = CITIES.includes(query.city as City) ? (query.city as City) : CITIES[0];
  const days = upcomingDays(7);
  const { selectedDay, availableDays, theaters } = await getShowtimes(movie.id, city, query.date, days.map((d) => d.key));

  const link = (changes: { city?: string; date?: string }) => {
    const params = new URLSearchParams({ city, date: selectedDay, ...changes });
    return `/book/${movie.id}?${params}`;
  };

  return (
    <div className="pb-16">
      <MovieBanner movie={movie} />

      <div className="space-y-8 px-4 pt-8 sm:px-12">
        <Steps current={1} />

        {/* City picker */}
        <nav aria-label="Choose city" className="no-scrollbar flex gap-2 overflow-x-auto">
          {CITIES.map((c) => (
            <Link
              key={c}
              href={link({ city: c, date: "" })}
              aria-current={c === city ? "true" : undefined}
              className={`btn flex-none px-5 py-2 ${c === city ? "btn-light" : "btn-glass"}`}
            >
              📍 {c}
            </Link>
          ))}
        </nav>

        {/* Date strip */}
        <nav aria-label="Choose date" className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {days.map((d) => {
            const hasShows = availableDays.includes(d.key);
            const active = d.key === selectedDay;
            const className = `flex w-20 flex-none flex-col items-center rounded-2xl border px-3 py-3 transition ${
              active
                ? "border-transparent bg-gradient-to-b from-brand to-brand-2 text-white shadow-lg shadow-brand/30"
                : hasShows
                  ? "border-line bg-surface text-zinc-300 hover:border-white/25 hover:text-white"
                  : "cursor-not-allowed border-line bg-surface/50 text-zinc-600"
            }`;
            const content = (
              <>
                <span className="text-xs font-medium">{d.weekday}</span>
                <span className="text-2xl font-black">{d.day}</span>
                <span className="text-xs uppercase">{d.month}</span>
              </>
            );
            return hasShows ? (
              <Link key={d.key} href={link({ date: d.key })} aria-current={active ? "date" : undefined} className={className}>
                {content}
              </Link>
            ) : (
              <span key={d.key} className={className} aria-disabled>
                {content}
              </span>
            );
          })}
        </nav>

        <Legend />

        {/* Theaters and showtimes */}
        {theaters.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold text-white">No shows in {city} for this movie this week</p>
            <p className="mt-2 text-muted">Try another city above.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {theaters.map(({ theater, shows }) => (
              <li key={theater.id} className="card p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 lg:max-w-sm">
                    <h2 className="text-lg font-bold text-white">{theater.name}</h2>
                    <p className="text-sm text-muted">{theater.address}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {theater.amenities.map((a) => (
                        <span key={a} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-zinc-400">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    {shows.map((show) => (
                      <ShowChip key={show.id} show={show} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function availability(seatsLeft: number) {
  const ratio = seatsLeft / SEATS_PER_SCREEN;
  if (seatsLeft === 0) return { label: "Sold out", tone: "border-zinc-700 text-zinc-600" };
  if (ratio < 0.15) return { label: "Almost full", tone: "border-red-500/50 text-red-400 hover:bg-red-500/10" };
  if (ratio < 0.45) return { label: "Filling fast", tone: "border-amber-500/50 text-amber-400 hover:bg-amber-500/10" };
  return { label: "Available", tone: "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" };
}

function ShowChip({ show }: { show: ShowSlot }) {
  const { label, tone } = availability(show.seatsLeft);
  const prices = Object.values(show.prices);
  const title = `${label} · ${show.seatsLeft} seats left · ${formatINR(Math.min(...prices))}–${formatINR(Math.max(...prices))}`;
  const className = `group relative flex min-w-[104px] flex-col items-center rounded-xl border px-4 py-2.5 transition ${tone}`;
  const content = (
    <>
      <span className="text-sm font-bold">{formatTime(show.startsAt)}</span>
      <span className="text-[10px] tracking-wider text-zinc-400 uppercase">
        {FORMAT_LABELS[show.format]} · {show.language}
      </span>
    </>
  );

  if (show.seatsLeft === 0) {
    return (
      <span className={`${className} cursor-not-allowed`} title={title}>
        {content}
      </span>
    );
  }
  return (
    <Link href={`/book/show/${show.id}`} className={className} title={title}>
      {content}
    </Link>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400" /> Filling fast
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400" /> Almost full
      </span>
    </div>
  );
}
