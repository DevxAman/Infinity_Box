import { Suspense } from "react";
import { ROWS, type RowKey } from "@/lib/tmdb";
import { getBookableMovieIds } from "@/lib/booking/queries";
import HeroCarousel from "./HeroCarousel";
import RowList from "./RowList";
import TheaterSpotlight from "./TheaterSpotlight";
import { AsyncRow, RowSkeleton } from "./Row";

interface Props {
  /** Row whose top titles rotate in the hero banner. */
  heroFrom: RowKey;
  rows: RowKey[];
  /** Show the Top 10 row and the "Now in Theaters" booking section. */
  featured?: boolean;
}

export default async function BrowsePage({ heroFrom, rows, featured = false }: Props) {
  const [heroCandidates, bookableIds] = await Promise.all([
    ROWS[heroFrom].fetch().catch(() => []),
    getBookableMovieIds(),
  ]);
  // Only titles with a real synopsis make a good hero slide.
  const heroTitles = heroCandidates.filter((t) => t.overview.length > 40).slice(0, 5);

  return (
    <>
      <HeroCarousel titles={heroTitles} bookableIds={bookableIds} />
      <div className="relative z-10 -mt-24 space-y-8 pb-8 sm:space-y-10">
        {featured && (
          <>
            <Suspense fallback={<RowSkeleton />}>
              <AsyncRow label={ROWS.top10.label} fetchTitles={ROWS.top10.fetch} variant="top10" />
            </Suspense>
            <Suspense fallback={null}>
              <TheaterSpotlight />
            </Suspense>
          </>
        )}
        <RowList rows={rows} />
      </div>
    </>
  );
}
