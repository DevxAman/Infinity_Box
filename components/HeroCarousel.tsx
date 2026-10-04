"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Title } from "@/lib/tmdb";
import { imageUrl } from "@/lib/utils";
import MyListButton from "./MyListButton";

const SLIDE_MS = 8000;

interface Props {
  titles: Title[];
  /** Movie ids that have theater shows, to show a "Book Tickets" button. */
  bookableIds: number[];
}

export default function HeroCarousel({ titles, bookableIds }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance; restarting the timer whenever the slide changes.
  useEffect(() => {
    if (paused || titles.length < 2) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % titles.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, titles.length]);

  const title = titles[index];
  if (!title) return <div className="h-40" />;

  const href = `/title/${title.mediaType}/${title.id}`;
  const bookable = title.mediaType === "movie" && bookableIds.includes(title.id);

  return (
    <section
      className="relative h-[85vh] min-h-[560px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={title.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <Image
            src={imageUrl(title.backdropPath, "original")!}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="animate-ken-burns object-cover object-top"
          />
        </motion.div>
      </AnimatePresence>

      {/* Readability gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="relative flex h-full max-w-3xl flex-col justify-center px-4 pt-16 sm:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={title.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-brand to-brand-2 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
                #{index + 1} Trending
              </span>
              {bookable && <span className="chip border-brand/40 text-white">🎟️ Now in theaters</span>}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
              {title.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <span className="font-semibold text-amber-400">★ {title.rating.toFixed(1)}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              {title.year && <span>{title.year}</span>}
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <span>{title.mediaType === "tv" ? "Series" : "Movie"}</span>
            </div>
            <p className="line-clamp-3 max-w-2xl text-base text-zinc-300 sm:text-lg">{title.overview}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              {bookable ? (
                <Link href={`/book/${title.id}`} className="btn btn-primary">
                  🎟️ Book Tickets
                </Link>
              ) : null}
              <Link href={`${href}#trailer`} className={`btn ${bookable ? "btn-glass" : "btn-light"}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Trailer
              </Link>
              <Link href={href} className="btn btn-glass">
                More Info
              </Link>
              <MyListButton title={title} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators with progress */}
        <div className="mt-10 flex gap-2" role="tablist" aria-label="Choose slide">
          {titles.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${t.title}`}
              onClick={() => setIndex(i)}
              className={`relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all ${i === index ? "w-12" : "w-6 hover:bg-white/50"}`}
            >
              {i === index && (
                <span
                  key={`${index}-${paused}`}
                  className="animate-progress absolute inset-0 rounded-full bg-white"
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
