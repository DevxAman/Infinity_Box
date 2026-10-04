/**
 * Seeds theaters, screens, seats and 7 days of showtimes for the movies that
 * are currently in Indian theaters (according to TMDB). Also pre-books a
 * random share of seats so the seat maps look realistic.
 *
 * Run with: npm run db:seed   (safe to re-run; it rebuilds all show data)
 */
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma, type SeatTier, type ShowFormat } from "@prisma/client";
import { CITIES, SEAT_LAYOUT, CONVENIENCE_FEE_PER_SEAT, type City } from "../lib/booking/config";

const db = new PrismaClient();

const TMDB_BASE = process.env.TMDB_API_BASE ?? "https://api.tmdb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

const DAYS = 7;
const SHOW_TIMES_IST = ["09:45", "13:00", "16:15", "19:30", "22:40"];
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

const LANGUAGES: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", ml: "Malayalam", kn: "Kannada", ja: "Japanese", ko: "Korean",
};

// Fictional theater chains in real neighbourhoods.
const CHAINS = {
  aurora: {
    name: "Aurora IMAX",
    amenities: ["IMAX Laser", "Dolby Atmos", "Recliners", "Food & Beverage", "Parking"],
    screens: [{ name: "IMAX Screen", format: "IMAX" }, { name: "Screen 2", format: "TWO_D" }],
  },
  starlight: {
    name: "Starlight Cinemas",
    amenities: ["Dolby 7.1", "Recliners", "Food & Beverage", "Wheelchair Access"],
    screens: [{ name: "Screen 1", format: "TWO_D" }, { name: "Screen 2", format: "TWO_D" }],
  },
  cineverse: {
    name: "Cineverse",
    amenities: ["4K Laser", "Dolby Atmos", "3D", "Food & Beverage", "Parking"],
    screens: [{ name: "Screen 1", format: "TWO_D" }, { name: "Screen 2 (3D)", format: "THREE_D" }],
  },
} satisfies Record<string, { name: string; amenities: string[]; screens: { name: string; format: ShowFormat }[] }>;

const LOCATIONS: Record<City, { chain: keyof typeof CHAINS; area: string; address: string }[]> = {
  Mumbai: [
    { chain: "aurora", area: "Lower Parel", address: "Senapati Bapat Marg, Lower Parel, Mumbai 400013" },
    { chain: "starlight", area: "Andheri West", address: "New Link Road, Andheri West, Mumbai 400053" },
    { chain: "cineverse", area: "Powai", address: "Hiranandani Gardens, Powai, Mumbai 400076" },
  ],
  "Delhi NCR": [
    { chain: "aurora", area: "Saket", address: "Press Enclave Marg, Saket, New Delhi 110017" },
    { chain: "starlight", area: "Connaught Place", address: "Outer Circle, Connaught Place, New Delhi 110001" },
    { chain: "cineverse", area: "Cyber City", address: "DLF Cyber City, Gurugram 122002" },
  ],
  Bengaluru: [
    { chain: "aurora", area: "Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru 560066" },
    { chain: "starlight", area: "Koramangala", address: "80 Feet Road, Koramangala, Bengaluru 560034" },
    { chain: "cineverse", area: "Indiranagar", address: "100 Feet Road, Indiranagar, Bengaluru 560038" },
  ],
  Hyderabad: [
    { chain: "aurora", area: "Hitech City", address: "Madhapur Main Road, Hitech City, Hyderabad 500081" },
    { chain: "starlight", area: "Banjara Hills", address: "Road No. 1, Banjara Hills, Hyderabad 500034" },
    { chain: "cineverse", area: "Gachibowli", address: "Financial District, Gachibowli, Hyderabad 500032" },
  ],
};

// Ticket prices in paise per format.
const PRICES: Record<ShowFormat, Record<SeatTier, number>> = {
  TWO_D: { REGULAR: 18000, PREMIUM: 25000, RECLINER: 45000 },
  THREE_D: { REGULAR: 23000, PREMIUM: 30000, RECLINER: 50000 },
  IMAX: { REGULAR: 32000, PREMIUM: 42000, RECLINER: 65000 },
};

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** UTC Date for "HH:MM" IST on the IST day `dayOffset` days from today. */
function istShowTime(dayOffset: number, hhmm: string) {
  const todayIST = new Date(Date.now() + dayOffset * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Date(`${todayIST}T${hhmm}:00+05:30`);
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

async function main() {
  if (!TMDB_KEY) throw new Error("TMDB_API_KEY is missing");

  console.log("🎬 Fetching movies now playing in India…");
  type RawMovie = { id: number; poster_path: string | null; backdrop_path: string | null };
  const nowPlaying = await tmdb<{ results: RawMovie[] }>("/movie/now_playing", { region: "IN", language: "en-US" });
  const picks = nowPlaying.results.filter((m) => m.poster_path && m.backdrop_path).slice(0, 10);

  const movies = await Promise.all(
    picks.map((m) =>
      tmdb<{
        id: number; title: string; overview: string; poster_path: string; backdrop_path: string; runtime: number | null;
        genres: { name: string }[]; vote_average: number; original_language: string; release_date: string; popularity: number;
      }>(`/movie/${m.id}`, { language: "en-US" }),
    ),
  );

  console.log("🧹 Clearing old show data…");
  await db.bookedSeat.deleteMany();
  await db.booking.deleteMany();
  await db.show.deleteMany();
  await db.seat.deleteMany();
  await db.screen.deleteMany();
  await db.theater.deleteMany();
  await db.movie.deleteMany();

  await db.movie.createMany({
    data: movies.map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      posterPath: m.poster_path,
      backdropPath: m.backdrop_path,
      runtime: m.runtime,
      genres: m.genres.map((g) => g.name),
      rating: Math.round(m.vote_average * 10) / 10,
      language: LANGUAGES[m.original_language] ?? "English",
      releaseDate: m.release_date || null,
      popularity: m.popularity,
    })),
  });
  console.log(`   ${movies.length} movies: ${movies.map((m) => m.title).join(", ")}`);

  console.log("🏛️  Creating theaters, screens and seats…");
  const theaters: { id: string; name: string; city: string; address: string; amenities: string[] }[] = [];
  const screens: { id: string; theaterId: string; name: string; format: ShowFormat }[] = [];
  const seats: { id: string; screenId: string; row: string; number: number; tier: SeatTier }[] = [];

  for (const city of CITIES) {
    for (const loc of LOCATIONS[city]) {
      const chain = CHAINS[loc.chain];
      const theater = { id: randomUUID(), name: `${chain.name} · ${loc.area}`, city, address: loc.address, amenities: chain.amenities };
      theaters.push(theater);
      for (const s of chain.screens) {
        const screen = { id: randomUUID(), theaterId: theater.id, name: s.name, format: s.format };
        screens.push(screen);
        for (const section of SEAT_LAYOUT) {
          for (const row of section.rows) {
            for (let n = 1; n <= section.seatsPerRow; n++) {
              seats.push({ id: randomUUID(), screenId: screen.id, row, number: n, tier: section.tier });
            }
          }
        }
      }
    }
  }

  await db.theater.createMany({ data: theaters });
  await db.screen.createMany({ data: screens.map(({ format: _format, ...s }) => s) });
  await db.seat.createMany({ data: seats });

  console.log("🗓️  Scheduling a week of shows…");
  const shows: {
    id: string; screenId: string; movieId: number; startsAt: Date; format: ShowFormat; language: string;
    priceRecliner: number; pricePremium: number; priceRegular: number;
  }[] = [];

  screens.forEach((screen, screenIndex) => {
    for (let day = 0; day < DAYS; day++) {
      SHOW_TIMES_IST.forEach((time, slot) => {
        const movie = movies[(screenIndex * 3 + slot + day) % movies.length];
        const startsAt = istShowTime(day, time);
        if (startsAt.getTime() < Date.now()) return; // skip shows already over today
        const prices = PRICES[screen.format];
        shows.push({
          id: randomUUID(),
          screenId: screen.id,
          movieId: movie.id,
          startsAt,
          format: screen.format,
          language: LANGUAGES[movie.original_language] ?? "English",
          priceRecliner: prices.RECLINER,
          pricePremium: prices.PREMIUM,
          priceRegular: prices.REGULAR,
        });
      });
    }
  });
  await db.show.createMany({ data: shows });

  console.log("🎟️  Pre-booking seats for realism…");
  await db.profile.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID, email: "audience@infinitybox.demo", fullName: "Other moviegoers" },
    update: {},
  });

  const seatsByScreen = new Map<string, typeof seats>();
  for (const seat of seats) {
    if (!seatsByScreen.has(seat.screenId)) seatsByScreen.set(seat.screenId, []);
    seatsByScreen.get(seat.screenId)!.push(seat);
  }

  const bookings: Prisma.BookingCreateManyInput[] = [];
  const bookedSeats: { id: string; bookingId: string; showId: string; seatId: string; price: number }[] = [];

  shows.forEach((show, i) => {
    const hour = Number(show.startsAt.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit" }));
    const occupancy = (hour >= 19 ? 0.45 : 0.15) + Math.random() * 0.35; // evenings fill up faster
    const screenSeats = seatsByScreen.get(show.screenId)!;
    const taken = screenSeats.filter(() => Math.random() < occupancy);
    if (taken.length === 0) return;

    const prices = { RECLINER: show.priceRecliner, PREMIUM: show.pricePremium, REGULAR: show.priceRegular };
    const subtotal = taken.reduce((sum, s) => sum + prices[s.tier], 0);
    const bookingId = randomUUID();
    bookings.push({
      id: bookingId,
      code: `SEED-${String(i).padStart(5, "0")}`,
      userId: DEMO_USER_ID,
      showId: show.id,
      status: "CONFIRMED",
      subtotal,
      convenienceFee: taken.length * CONVENIENCE_FEE_PER_SEAT,
      total: subtotal + taken.length * CONVENIENCE_FEE_PER_SEAT,
      holdExpiresAt: new Date(),
      paidAt: new Date(),
    });
    for (const seat of taken) {
      bookedSeats.push({ id: randomUUID(), bookingId, showId: show.id, seatId: seat.id, price: prices[seat.tier] });
    }
  });

  for (const batch of chunk(bookings, 2000)) await db.booking.createMany({ data: batch });
  for (const batch of chunk(bookedSeats, 5000)) await db.bookedSeat.createMany({ data: batch });

  console.log(
    `✅ Done: ${theaters.length} theaters, ${screens.length} screens, ${seats.length} seats, ${shows.length} shows, ${bookedSeats.length} pre-booked seats.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
