"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { SeatTier } from "@prisma/client";
import { holdSeats } from "@/lib/booking/actions";
import { MAX_SEATS_PER_BOOKING, SEAT_LAYOUT, TIER_LABELS } from "@/lib/booking/config";
import { calculateTotals, type TierPrices } from "@/lib/booking/pricing";
import { formatINR } from "@/lib/utils";

type Seat = { id: string; row: string; number: number; tier: SeatTier };

interface Props {
  showId: string;
  seats: Seat[];
  takenSeatIds: string[];
  prices: TierPrices;
}

export default function SeatPicker({ showId, seats, takenSeatIds, prices }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const taken = useMemo(() => new Set(takenSeatIds), [takenSeatIds]);
  const seatsById = useMemo(() => new Map(seats.map((s) => [s.id, s])), [seats]);
  const seatsByRow = useMemo(() => {
    const map = new Map<string, Seat[]>();
    for (const seat of seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    }
    return map;
  }, [seats]);

  const selectedSeats = selected.map((id) => seatsById.get(id)!).filter(Boolean);
  // Display-only estimate; the server recalculates the real amount.
  const totals = calculateTotals(
    selectedSeats.map((s) => s.tier),
    prices,
  );

  const toggle = (seat: Seat) => {
    if (taken.has(seat.id)) return;
    setSelected((current) => {
      if (current.includes(seat.id)) return current.filter((id) => id !== seat.id);
      if (current.length >= MAX_SEATS_PER_BOOKING) {
        toast.warning(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at a time.`);
        return current;
      }
      return [...current, seat.id];
    });
  };

  const proceed = () => {
    startTransition(async () => {
      // On success the server action redirects to checkout.
      const result = await holdSeats({ showId, seatIds: selected });
      if (result?.error) {
        toast.error(result.error);
        setSelected([]);
        router.refresh(); // reload the latest seat availability
      }
    });
  };

  return (
    <div className="pb-36">
      {/* The screen */}
      <div className="mx-auto mb-12 max-w-3xl px-4" aria-hidden>
        <div className="animate-glow h-2 rounded-[50%] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_8px_40px_8px_rgba(255,255,255,0.25)]" />
        <div className="mx-auto h-16 w-[90%] bg-gradient-to-b from-white/10 to-transparent [clip-path:polygon(0_0,100%_0,92%_100%,8%_100%)]" />
        <p className="-mt-12 text-center text-xs tracking-[0.4em] text-zinc-500 uppercase">All eyes this way please</p>
      </div>

      {/* Seat grid (scrolls sideways on small phones) */}
      <div className="no-scrollbar overflow-x-auto px-4">
        <div className="mx-auto w-fit space-y-8">
          {SEAT_LAYOUT.map((section) => (
            <section key={section.tier} aria-label={`${TIER_LABELS[section.tier]} seats`}>
              <h3 className="mb-3 border-b border-line pb-2 text-center text-xs tracking-widest text-zinc-400 uppercase">
                {TIER_LABELS[section.tier]} · <span className="font-semibold text-white">{formatINR(prices[section.tier])}</span>
              </h3>
              <div className="space-y-2">
                {section.rows.map((row) => (
                  <div key={row} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="w-5 text-center text-xs font-medium text-zinc-500">{row}</span>
                    {(seatsByRow.get(row) ?? []).map((seat) => (
                      <div key={seat.id} className="flex gap-1.5 sm:gap-2">
                        <SeatButton
                          seat={seat}
                          price={prices[seat.tier]}
                          isTaken={taken.has(seat.id)}
                          isSelected={selected.includes(seat.id)}
                          onToggle={toggle}
                        />
                        {section.aisleAfter.includes(seat.number) && <span className="w-4 sm:w-6" aria-hidden />}
                      </div>
                    ))}
                    <span className="w-5 text-center text-xs font-medium text-zinc-500">{row}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-10 flex flex-wrap justify-center gap-5 px-4 text-xs text-zinc-400">
        <LegendItem className="border border-emerald-500/60" label="Available" />
        <LegendItem className="bg-gradient-to-br from-brand to-brand-2" label="Selected" />
        <LegendItem className="bg-zinc-800" label="Sold" />
        <LegendItem className="border border-amber-400/60" label="Recliner" />
      </div>

      {/* Sticky checkout bar */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 px-4 py-4 backdrop-blur-xl sm:px-12"
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} ·{" "}
                  <span className="text-zinc-300">{selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}</span>
                </p>
                <p className="text-2xl font-black text-white">
                  {formatINR(totals.total)}
                  <span className="ml-2 text-xs font-normal text-muted">incl. {formatINR(totals.convenienceFee)} fee</span>
                </p>
              </div>
              <button type="button" onClick={proceed} disabled={pending} className="btn btn-primary flex-none px-8">
                {pending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Holding seats…
                  </>
                ) : (
                  "Proceed to Pay →"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SeatButton({
  seat,
  price,
  isTaken,
  isSelected,
  onToggle,
}: {
  seat: Seat;
  price: number;
  isTaken: boolean;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
}) {
  const recliner = seat.tier === "RECLINER";
  const base = `grid place-items-center text-[10px] font-semibold transition ${
    recliner ? "h-8 w-10 rounded-t-xl rounded-b-md sm:h-9 sm:w-12" : "h-7 w-7 rounded-md sm:h-8 sm:w-8"
  }`;
  const state = isTaken
    ? "cursor-not-allowed bg-zinc-800/80 text-transparent"
    : isSelected
      ? "bg-gradient-to-br from-brand to-brand-2 text-white shadow-lg shadow-brand/40"
      : recliner
        ? "border border-amber-400/60 text-amber-300/80 hover:bg-amber-400/15"
        : "border border-emerald-500/50 text-emerald-300/70 hover:bg-emerald-500/15";

  return (
    <motion.button
      type="button"
      whileTap={isTaken ? undefined : { scale: 0.85 }}
      animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
      disabled={isTaken}
      onClick={() => onToggle(seat)}
      aria-pressed={isSelected}
      aria-label={`Seat ${seat.row}${seat.number}, ${TIER_LABELS[seat.tier]}, ${formatINR(price)}${isTaken ? ", sold" : ""}`}
      title={isTaken ? "Sold" : `${seat.row}${seat.number} · ${formatINR(price)}`}
      className={`${base} ${state}`}
    >
      {seat.number}
    </motion.button>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded ${className}`} />
      {label}
    </span>
  );
}
