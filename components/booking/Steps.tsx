const STEPS = ["Showtime", "Seats", "Payment", "Ticket"];

/** Progress indicator for the 4-step booking flow (current is 1-based). */
export default function Steps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm" aria-label="Booking progress">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            <span
              className={`grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-bold transition ${
                active
                  ? "bg-gradient-to-r from-brand to-brand-2 text-white shadow-lg shadow-brand/30"
                  : done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/5 text-zinc-500"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={`hidden sm:inline ${active ? "font-semibold text-white" : "text-zinc-500"}`}>{step}</span>
            {n < STEPS.length && <span className={`h-px w-6 sm:w-12 ${done ? "bg-emerald-500/40" : "bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
