import type { Metadata } from "next";
import MyListView from "./MyListView";

export const metadata: Metadata = {
  title: "My List",
  robots: { index: false },
};

export default function MyListPage() {
  return (
    <div className="min-h-[70vh] px-4 pb-16 pt-28 sm:px-12">
      <h1 className="mb-6 text-3xl font-bold">My List</h1>
      <MyListView />
    </div>
  );
}
