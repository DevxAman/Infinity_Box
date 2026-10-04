import type { Metadata } from "next";
import BrowsePage from "@/components/BrowsePage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse popular, top rated, and upcoming movies.",
};

export default function MoviesPage() {
  return (
    <BrowsePage
      heroFrom="nowPlaying"
      rows={["popularMovies", "nowPlaying", "topRatedMovies", "upcoming", "action", "comedy", "scifi", "horror", "animation", "documentaries"]}
    />
  );
}
