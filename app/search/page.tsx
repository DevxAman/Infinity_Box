import type { Metadata } from "next";
import { searchTitles } from "@/lib/tmdb";
import TitleGrid from "@/components/TitleGrid";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);
  const results = query ? await searchTitles(query) : [];

  return (
    <div className="min-h-[70vh] px-4 pb-16 pt-28 sm:px-12">
      {!query ? (
        <p className="text-lg text-neutral-400">Start typing in the search box to find movies and TV shows.</p>
      ) : results.length === 0 ? (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">No results for &ldquo;{query}&rdquo;</h1>
          <p className="text-neutral-400">Try a different title, or check the spelling.</p>
        </div>
      ) : (
        <>
          <h1 className="mb-6 text-xl text-neutral-400">
            Results for <span className="font-semibold text-white">&ldquo;{query}&rdquo;</span>
          </h1>
          <TitleGrid titles={results} />
        </>
      )}
    </div>
  );
}
