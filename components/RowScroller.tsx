"use client";

import { useRef } from "react";

/** Horizontal scroller with arrow buttons; native scroll + snap on touch. */
export default function RowScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="group/row relative">
      <ArrowButton side="left" onClick={() => scroll(-1)} />
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 py-4 sm:gap-3 sm:px-12"
      >
        {children}
      </div>
      <ArrowButton side="right" onClick={() => scroll(1)} />
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute inset-y-0 z-20 hidden w-12 items-center justify-center bg-black/50 text-white opacity-0 transition hover:bg-black/70 focus-visible:opacity-100 group-hover/row:opacity-100 sm:flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
        <path d={side === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
