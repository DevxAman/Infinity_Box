import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { istDateKey, istDayRange } from "@/lib/utils";
import { BOOKING_CUTOFF_MINUTES, SEATS_PER_SCREEN } from "./config";
import { showPrices } from "./pricing";

/** Booking features switch on once a database is configured. */
export const bookingEnabled = Boolean(process.env.DATABASE_URL);

/** A seat is taken if it's paid for, or held by a payment still in progress. */
function activeBooking(): Prisma.BookingWhereInput {
  return { OR: [{ status: "CONFIRMED" }, { status: "PENDING", holdExpiresAt: { gt: new Date() } }] };
}

const bookingOpensBefore = () => new Date(Date.now() + BOOKING_CUTOFF_MINUTES * 60 * 1000);

/** Run a query for a non-critical page section; log and fall back on failure. */
async function safely<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  if (!bookingEnabled) return fallback;
  try {
    return await query();
  } catch (err) {
    console.error("[booking] query failed:", err);
    return fallback;
  }
}

export function getMoviesInTheaters() {
  return safely([], () =>
    db.movie.findMany({
      where: { shows: { some: { startsAt: { gt: bookingOpensBefore() } } } },
      orderBy: { popularity: "desc" },
    }),
  );
}

export async function getBookableMovieIds() {
  const movies = await getMoviesInTheaters();
  return movies.map((m) => m.id);
}

export function getMovie(movieId: number) {
  return safely(null, () => db.movie.findUnique({ where: { id: movieId } }));
}

/**
 * All bookable shows of a movie in a city over the next week, grouped by
 * theater for one selected day, plus which days have any shows at all.
 */
export async function getShowtimes(movieId: number, city: string, dateKey: string | undefined, days: string[]) {
  const shows = await db.show.findMany({
    where: {
      movieId,
      startsAt: { gt: bookingOpensBefore(), lt: istDayRange(days[days.length - 1]).end },
      screen: { theater: { city } },
    },
    include: { screen: { include: { theater: true } } },
    orderBy: { startsAt: "asc" },
  });

  const availableDays = [...new Set(shows.map((s) => istDateKey(s.startsAt)))];
  const selectedDay = dateKey && availableDays.includes(dateKey) ? dateKey : (availableDays[0] ?? days[0]);
  const dayShows = shows.filter((s) => istDateKey(s.startsAt) === selectedDay);

  const taken = await db.bookedSeat.groupBy({
    by: ["showId"],
    where: { showId: { in: dayShows.map((s) => s.id) }, booking: activeBooking() },
    _count: { _all: true },
  });
  const takenByShow = new Map(taken.map((t) => [t.showId, t._count._all]));

  const theaters = new Map<string, { theater: (typeof dayShows)[number]["screen"]["theater"]; shows: ShowSlot[] }>();
  for (const show of dayShows) {
    const { theater } = show.screen;
    if (!theaters.has(theater.id)) theaters.set(theater.id, { theater, shows: [] });
    theaters.get(theater.id)!.shows.push({
      id: show.id,
      startsAt: show.startsAt,
      format: show.format,
      language: show.language,
      screenName: show.screen.name,
      seatsLeft: SEATS_PER_SCREEN - (takenByShow.get(show.id) ?? 0),
      prices: showPrices(show),
    });
  }

  return { selectedDay, availableDays, theaters: [...theaters.values()] };
}

export type ShowSlot = {
  id: string;
  startsAt: Date;
  format: "TWO_D" | "THREE_D" | "IMAX";
  language: string;
  screenName: string;
  seatsLeft: number;
  prices: ReturnType<typeof showPrices>;
};

/** Everything the seat picker needs. The user's own unpaid hold counts as free. */
export async function getShowForSeatPicker(showId: string, userId: string) {
  const show = await db.show.findUnique({
    where: { id: showId },
    include: {
      movie: true,
      screen: { include: { theater: true, seats: { orderBy: [{ row: "asc" }, { number: "asc" }] } } },
    },
  });
  if (!show) return null;

  const taken = await db.bookedSeat.findMany({
    where: { showId, booking: { AND: [activeBooking(), { NOT: { userId, status: "PENDING" } }] } },
    select: { seatId: true },
  });

  return { show, takenSeatIds: taken.map((t) => t.seatId) };
}

const bookingDetails = {
  show: { include: { movie: true, screen: { include: { theater: true } } } },
  seats: { include: { seat: true }, orderBy: { seat: { number: "asc" } } },
} satisfies Prisma.BookingInclude;

export type BookingWithDetails = Prisma.BookingGetPayload<{ include: typeof bookingDetails }>;

export function getBookingForUser(bookingId: string, userId: string) {
  return db.booking.findFirst({ where: { id: bookingId, userId }, include: bookingDetails });
}

export function getUserBookings(userId: string) {
  return db.booking.findMany({
    where: {
      userId,
      OR: [{ status: { in: ["CONFIRMED", "FAILED"] } }, { status: "PENDING", holdExpiresAt: { gt: new Date() } }],
    },
    include: bookingDetails,
    orderBy: { show: { startsAt: "asc" } },
  });
}
