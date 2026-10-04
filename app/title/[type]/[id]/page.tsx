import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTitleDetails, TmdbError, type MediaType } from "@/lib/tmdb";
import { formatRuntime, imageUrl } from "@/lib/utils";
import MyListButton from "@/components/MyListButton";
import TrailerPlayer from "@/components/TrailerPlayer";
import { Row } from "@/components/Row";
import { getBookableMovieIds } from "@/lib/booking/queries";
import Link from "next/link";

export const revalidate = 3600;

interface Props {
  params: Promise<{ type: string; id: string }>;
}

// Validate URL params and dedupe the fetch between generateMetadata and the page.
const load = cache(async (type: string, id: string) => {
  const numericId = Number(id);
  if ((type !== "movie" && type !== "tv") || !Number.isInteger(numericId) || numericId <= 0) notFound();
  try {
    return await getTitleDetails(type as MediaType, numericId);
  } catch (err) {
    if (err instanceof TmdbError && err.status === 404) notFound();
    throw err;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, id } = await params;
  const t = await load(type, id);
  const og = imageUrl(t.backdropPath, "w1280");
  return {
    title: t.year ? `${t.title} (${t.year})` : t.title,
    description: t.overview.slice(0, 160),
    openGraph: { title: t.title, description: t.overview.slice(0, 200), images: og ? [og] : [] },
  };
}

export default async function TitlePage({ params }: Props) {
  const { type, id } = await params;
  const t = await load(type, id);
  const backdrop = imageUrl(t.backdropPath, "original");
  const poster = imageUrl(t.posterPath, "w500");
  const runtime = formatRuntime(t.runtime);
  const bookable = t.mediaType === "movie" && (await getBookableMovieIds()).includes(t.id);

  return (
    <article>
      <section className="relative min-h-[70vh] w-full">
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <div className="relative flex flex-col gap-8 px-4 pb-12 pt-28 sm:px-12 md:flex-row md:items-end">
          {poster && (
            <div className="relative hidden aspect-[2/3] w-64 flex-none overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10 md:block">
              <Image src={poster} alt={`${t.title} poster`} fill sizes="256px" className="object-cover" />
            </div>
          )}
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
            {t.tagline && <p className="text-lg italic text-neutral-300">{t.tagline}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-300">
              <span className="font-semibold text-amber-400">★ {t.rating.toFixed(1)}</span>
              {t.year && <span>{t.year}</span>}
              {runtime && <span>{runtime}</span>}
              {t.seasons && <span>{t.seasons} season{t.seasons > 1 ? "s" : ""}</span>}
              <span className="rounded border border-neutral-500 px-1.5 text-xs">{t.mediaType === "tv" ? "Series" : "Movie"}</span>
            </div>
            {t.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {t.genres.map((g) => (
                  <li key={g} className="chip">
                    {g}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-base leading-relaxed text-neutral-200 sm:text-lg">{t.overview || "No synopsis available."}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              {bookable && (
                <Link href={`/book/${t.id}`} className="btn btn-primary">
                  🎟️ Book Tickets
                </Link>
              )}
              {t.trailerKey && (
                <a href="#trailer" className="btn btn-light">
                  ▶ Watch Trailer
                </a>
              )}
              <MyListButton title={t} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-12 pb-16">
        <section id="trailer" className="scroll-mt-24 px-4 sm:px-12">
          <h2 className="mb-4 text-xl font-bold">Trailer</h2>
          {t.trailerKey ? (
            <div className="max-w-4xl">
              <TrailerPlayer videoKey={t.trailerKey} title={t.title} />
            </div>
          ) : (
            <p className="text-neutral-400">No trailer available for this title.</p>
          )}
        </section>

        {t.cast.length > 0 && (
          <section className="px-4 sm:px-12">
            <h2 className="mb-4 text-xl font-bold">Top Cast</h2>
            <ul className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {t.cast.map((c) => {
                const photo = imageUrl(c.profilePath, "w185");
                return (
                  <li key={c.id} className="w-28 flex-none text-center">
                    <div className="relative mx-auto mb-2 h-28 w-28 overflow-hidden rounded-full bg-neutral-800">
                      {photo ? (
                        <Image src={photo} alt={c.name} fill sizes="112px" className="object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-2xl font-bold text-neutral-500">{c.name[0]}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight">{c.name}</p>
                    <p className="line-clamp-2 text-xs text-neutral-400">{c.character}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Row label="More Like This" titles={t.similar} />
      </div>
    </article>
  );
}
