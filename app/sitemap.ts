import type { MetadataRoute } from "next";
import { ROWS } from "@/lib/tmdb";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/movies", "/tv", "/tickets"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily" as const,
    priority: path ? 0.8 : 1,
  }));

  const titles = await Promise.all([ROWS.trending.fetch(), ROWS.popularMovies.fetch(), ROWS.popularTv.fetch()])
    .then((lists) => lists.flat())
    .catch(() => []);

  const seen = new Set<string>();
  const titleRoutes = titles
    .map((t) => `${siteUrl}/title/${t.mediaType}/${t.id}`)
    .filter((url) => !seen.has(url) && seen.add(url))
    .map((url) => ({ url, changeFrequency: "weekly" as const, priority: 0.6 }));

  return [...staticRoutes, ...titleRoutes];
}
