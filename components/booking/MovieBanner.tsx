import Image from "next/image";
import type { Movie } from "@prisma/client";
import { formatRuntime, imageUrl } from "@/lib/utils";

/** Blurred-backdrop header used across the booking flow. */
export default function MovieBanner({ movie, children }: { movie: Movie; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {movie.backdropPath && (
        <Image src={imageUrl(movie.backdropPath, "w1280")!} alt="" fill priority sizes="100vw" className="scale-110 object-cover opacity-30 blur-2xl" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
      <div className="relative flex items-center gap-5 px-4 pb-8 pt-24 sm:gap-8 sm:px-12">
        {movie.posterPath && (
          <div className="relative aspect-[2/3] w-24 flex-none overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 sm:w-32">
            <Image src={imageUrl(movie.posterPath, "w300")!} alt={`${movie.title} poster`} fill sizes="128px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{movie.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="chip text-amber-400">★ {movie.rating.toFixed(1)}</span>
            <span className="chip">{movie.language}</span>
            {movie.runtime && <span className="chip">{formatRuntime(movie.runtime)}</span>}
            {movie.genres.slice(0, 3).map((g) => (
              <span key={g} className="chip hidden sm:inline-flex">
                {g}
              </span>
            ))}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
