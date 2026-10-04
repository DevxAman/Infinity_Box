import "server-only";

/**
 * Thin, typed wrapper around the TMDB v3 API.
 * Runs only on the server so the API key never reaches the browser.
 */

const API_BASE = process.env.TMDB_API_BASE ?? "https://api.tmdb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

export type MediaType = "movie" | "tv";

export interface Title {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  year: string;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface TitleDetails extends Title {
  tagline: string;
  genres: string[];
  runtime: number | null;
  seasons: number | null;
  trailerKey: string | null;
  cast: CastMember[];
  similar: Title[];
}

// Raw TMDB shapes (only the fields we use)
interface RawTitle {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface RawDetails extends RawTitle {
  tagline?: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  videos?: { results: Video[] };
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  similar?: { results: RawTitle[] };
  recommendations?: { results: RawTitle[] };
}

export class TmdbError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "TmdbError";
  }
}

async function tmdb<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 60 * 60,
): Promise<T> {
  if (!API_KEY) {
    throw new TmdbError("TMDB_API_KEY is not set. Add it to .env.local.");
  }

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { next: { revalidate } });
  if (res.status === 404) throw new TmdbError("Not found", 404);
  if (!res.ok) throw new TmdbError(`TMDB request failed: ${res.status}`, res.status);
  return res.json() as Promise<T>;
}

function normalize(raw: RawTitle, fallbackType: MediaType): Title {
  const mediaType: MediaType =
    raw.media_type === "movie" || raw.media_type === "tv" ? raw.media_type : fallbackType;
  const date = raw.release_date || raw.first_air_date || "";
  return {
    id: raw.id,
    mediaType,
    title: raw.title || raw.name || "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
    year: date.slice(0, 4),
  };
}

const withImages = (titles: Title[]) => titles.filter((t) => t.posterPath && t.backdropPath);

async function list(path: string, type: MediaType, params?: Record<string, string>) {
  const data = await tmdb<{ results: RawTitle[] }>(path, params);
  return withImages(data.results.map((r) => normalize(r, type)));
}

/** A curated set of rows. Each row knows how to fetch itself. */
export const ROWS = {
  trending: { label: "Trending Now", fetch: () => list("/trending/all/week", "movie") },
  top10: { label: "Top 10 Movies Today", fetch: () => list("/trending/movie/day", "movie") },
  popularMovies: { label: "Popular Movies", fetch: () => list("/movie/popular", "movie") },
  topRatedMovies: { label: "Top Rated Movies", fetch: () => list("/movie/top_rated", "movie") },
  nowPlaying: { label: "In Theaters", fetch: () => list("/movie/now_playing", "movie", { region: "IN" }) },
  upcoming: { label: "Coming Soon", fetch: () => list("/movie/upcoming", "movie") },
  popularTv: { label: "Popular TV Shows", fetch: () => list("/tv/popular", "tv") },
  topRatedTv: { label: "Top Rated TV", fetch: () => list("/tv/top_rated", "tv") },
  airingTv: { label: "On The Air", fetch: () => list("/tv/on_the_air", "tv") },
  action: {
    label: "Action & Adventure",
    fetch: () => list("/discover/movie", "movie", { with_genres: "28", sort_by: "popularity.desc" }),
  },
  comedy: {
    label: "Comedies",
    fetch: () => list("/discover/movie", "movie", { with_genres: "35", sort_by: "popularity.desc" }),
  },
  horror: {
    label: "Horror",
    fetch: () => list("/discover/movie", "movie", { with_genres: "27", sort_by: "popularity.desc" }),
  },
  scifi: {
    label: "Sci-Fi",
    fetch: () => list("/discover/movie", "movie", { with_genres: "878", sort_by: "popularity.desc" }),
  },
  animation: {
    label: "Animation",
    fetch: () => list("/discover/movie", "movie", { with_genres: "16", sort_by: "popularity.desc" }),
  },
  crimeTv: {
    label: "Crime TV",
    fetch: () => list("/discover/tv", "tv", { with_genres: "80", sort_by: "popularity.desc" }),
  },
  documentaries: {
    label: "Documentaries",
    fetch: () => list("/discover/movie", "movie", { with_genres: "99", sort_by: "popularity.desc" }),
  },
} satisfies Record<string, { label: string; fetch: () => Promise<Title[]> }>;

export type RowKey = keyof typeof ROWS;

export async function getTitleDetails(type: MediaType, id: number): Promise<TitleDetails> {
  const raw = await tmdb<RawDetails>(`/${type}/${id}`, {
    append_to_response: "videos,credits,recommendations,similar",
  });

  const videos = raw.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    videos.find((v) => v.site === "YouTube");

  const related = raw.recommendations?.results.length
    ? raw.recommendations.results
    : (raw.similar?.results ?? []);

  return {
    ...normalize(raw, type),
    mediaType: type,
    tagline: raw.tagline ?? "",
    genres: raw.genres?.map((g) => g.name) ?? [],
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    seasons: raw.number_of_seasons ?? null,
    trailerKey: trailer?.key ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    })),
    similar: withImages(related.map((r) => normalize(r, type))).slice(0, 18),
  };
}

export async function searchTitles(query: string): Promise<Title[]> {
  const data = await tmdb<{ results: RawTitle[] }>(
    "/search/multi",
    { query, include_adult: "false" },
    60 * 10,
  );
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => normalize(r, "movie"))
    .filter((t) => t.posterPath);
}
