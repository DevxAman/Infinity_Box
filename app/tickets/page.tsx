import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMoviesInTheaters } from "@/lib/booking/queries";
import { formatRuntime, imageUrl } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Book Movie Tickets",
  description: "Movies now showing in theaters near you. Pick a showtime, choose your seats and pay securely.",
};

export default async function TicketsPage() {
  const movies = await getMoviesInTheaters();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand/25 to-brand-2/20 blur-[120px]" />

      <header className="relative mx-auto mb-12 max-w-3xl text-center">
        <p className="chip mx-auto mb-5">🍿 Mumbai · Delhi NCR · Bengaluru · Hyderabad</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
          Your seat is <span className="text-gradient">waiting.</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Pick a movie, choose the perfect seats on a live seat map, and pay in seconds with UPI or card.
        </p>
        <ol className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-zinc-300">
          {["Choose a show", "Pick your seats", "Pay securely", "Get your QR ticket"].map((step, i) => (
            <li key={step} className="flex items-center gap-2 rounded-full border border-line bg-white/5 px-4 py-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-brand to-brand-2 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </header>

      {movies.length === 0 ? (
        <div className="card relative mx-auto max-w-lg p-10 text-center">
          <p className="text-lg font-semibold text-white">No shows scheduled right now</p>
          <p className="mt-2 text-muted">New showtimes are added regularly. Check back soon!</p>
        </div>
      ) : (
        <ul className="relative grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {movies.map((movie, i) => (
            <li key={movie.id}>
              <Link href={`/book/${movie.id}`} className="group block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-brand/20 group-hover:ring-brand/50">
                  <Image
                    src={imageUrl(movie.posterPath, "w500")!}
                    alt={`${movie.title} poster`}
                    fill
                    priority={i < 5}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 pt-12">
                    <span className="btn btn-primary w-full translate-y-2 py-2 text-xs opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      Book Tickets
                    </span>
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-400 backdrop-blur">
                    ★ {movie.rating.toFixed(1)}
                  </span>
                </div>
                <h2 className="mt-3 truncate font-semibold text-white">{movie.title}</h2>
                <p className="truncate text-sm text-muted">
                  {[movie.language, formatRuntime(movie.runtime), movie.genres[0]].filter(Boolean).join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
