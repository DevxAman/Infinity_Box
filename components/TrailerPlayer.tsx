"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Lightweight YouTube embed: shows a thumbnail and only loads the heavy
 * iframe after the user clicks play (saves ~1MB of JS per page view).
 */
export default function TrailerPlayer({ videoKey, title }: { videoKey: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={`${title} trailer`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play ${title} trailer`}
        >
          <Image
            src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover opacity-80 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-lg transition group-hover:scale-110 sm:h-20 sm:w-20">
              <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 text-white" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
