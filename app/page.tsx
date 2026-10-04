import BrowsePage from "@/components/BrowsePage";

export const revalidate = 3600;

export default function Home() {
  return (
    <BrowsePage
      heroFrom="trending"
      featured
      rows={[
        "trending",
        "popularMovies",
        "popularTv",
        "topRatedMovies",
        "action",
        "comedy",
        "crimeTv",
        "scifi",
        "horror",
        "animation",
        "upcoming",
        "documentaries",
      ]}
    />
  );
}
