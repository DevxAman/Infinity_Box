"use client";

import type { Title } from "@/lib/tmdb";
import { useMyList } from "@/lib/my-list";

interface Props {
  title: Title;
  variant?: "pill" | "icon";
}

export default function MyListButton({ title, variant = "pill" }: Props) {
  const { has, toggle } = useMyList();
  const saved = has(title);
  const label = saved ? "Remove from My List" : "Add to My List";

  // Store a slim copy so localStorage doesn't grow with details payloads.
  const slim: Title = {
    id: title.id,
    mediaType: title.mediaType,
    title: title.title,
    overview: title.overview,
    posterPath: title.posterPath,
    backdropPath: title.backdropPath,
    rating: title.rating,
    year: title.year,
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(slim);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={saved}
        title={label}
        className="grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur transition hover:scale-110 hover:border-white hover:bg-black/80"
      >
        {saved ? <CheckIcon /> : <PlusIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className="btn btn-glass"
    >
      {saved ? <CheckIcon /> : <PlusIcon />}
      {saved ? "In My List" : "My List"}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
