import type { Metadata } from "next";
import BrowsePage from "@/components/BrowsePage";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "TV Shows",
  description: "Browse popular, top rated, and currently airing TV shows.",
};

export default function TvPage() {
  return <BrowsePage heroFrom="popularTv" rows={["popularTv", "topRatedTv", "airingTv", "crimeTv"]} />;
}
