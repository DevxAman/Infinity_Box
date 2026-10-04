import Image from "next/image";
import Link from "next/link";
import { getMoviesInTheaters } from "@/lib/booking/queries";
import { formatRuntime, imageUrl } from "@/lib/utils";
import RowScroller from "./RowScroller";

/** Home page call-to-action: movies with bookable theater shows. */
export default async function TheaterSpotlight() {
  const movies = await getMoviesInTheaters();
  if (movies.length === 0) return null;

  return (
    <section aria-labelledby="spotlight-title" className="relative py-6">
      {/* soft brand glow behind the section */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 bg-gradient-to-r from-brand/15 via-brand-2/10 to-transparent blur-3xl" />

      <div className="relative flex items-end justify-between gap-4 px-4 sm:px-12">
        <div>
          <p className="text-gradient text-sm font-bold tracking-widest uppercase">🎟️ Book Tickets</p>
          <h2 id="spotlight-title" className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Now Showing in Theaters
          </h2>
        </div>
        <Link href="/tickets" className="btn btn-ghost px-4 py-2">
          View all →
        </Link>
      </div>

      <RowScroller>
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/book/${movie.id}`}
            className="group relative w-[80vw] flex-none snap-start overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-brand/50 sm:w-[46vw] lg:w-[30vw] xl:w-[24vw]"
          >
            <div className="relative aspect-video">
              <Image
                src={imageUrl(movie.backdropPath, "w780")!}
                alt=""
                fill
                sizes="(max-width: 640px) 80vw, 30vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-white">{movie.title}</h3>
                <p className="truncate text-xs text-zinc-300">
                  {[movie.language, formatRuntime(movie.runtime), movie.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="btn btn-primary flex-none px-4 py-2 text-xs">Book</span>
            </div>
          </Link>
        ))}
      </RowScroller>
    </section>
  );
}
