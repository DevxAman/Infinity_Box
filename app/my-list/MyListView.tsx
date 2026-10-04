"use client";

import Link from "next/link";
import { useMyList } from "@/lib/my-list";
import TitleGrid from "@/components/TitleGrid";

export default function MyListView() {
  const { list } = useMyList();

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-8">
        <p className="text-lg text-neutral-300">Your list is empty.</p>
        <p className="text-neutral-400">Hover any title and hit the + button to save it here.</p>
        <Link href="/" className="rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700">
          Browse titles
        </Link>
      </div>
    );
  }

  return <TitleGrid titles={list} />;
}
