# InfinityBox

A full-stack movie platform: browse trending movies and TV shows, watch trailers, keep a watchlist, and **book theater tickets** with live seat selection, Razorpay payments and QR e-tickets.

**Stack:** Next.js 15 (App Router, Server Components, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Supabase (Auth + Postgres) · Prisma · Razorpay · Vitest · GitHub Actions

## Features

**Discover**
- Rotating hero carousel, Netflix-style Top 10 row, 12+ category rows streamed in with Suspense
- Title pages with cast, trailer (lazy YouTube embed) and recommendations
- Debounced live search, "My List" watchlist (localStorage, synced across tabs)

**Book tickets**
- Now-showing movies across 4 cities and 12 theaters, 7 days of showtimes
- Availability badges per show (Available / Filling fast / Almost full / Sold out)
- Interactive seat map with Regular, Premium and Recliner tiers and a live price summary
- Seats held for 10 minutes during payment, with a countdown; no double-booking, ever
- Razorpay Checkout (UPI, cards, netbanking) with server-side signature verification and a webhook
- Confirmation with confetti, a printable e-ticket with QR code, and a My Bookings page

**Accounts**
- Email/password and Google sign-in (Supabase Auth), protected routes via middleware

## Architecture

```
app/
  page.tsx, movies/, tv/          Browse pages (static, ISR hourly)
  title/[type]/[id]/              Movie / show details
  tickets/                        Now showing in theaters
  book/[movieId]/                 Step 1: city, date, theater, showtime
  book/show/[showId]/             Step 2: seat selection        (auth)
  checkout/[bookingId]/           Step 3: Razorpay payment      (auth)
  bookings/, bookings/[id]/       Step 4: e-ticket + history    (auth)
  login/, signup/, auth/callback/ Supabase Auth
  api/webhooks/razorpay/          Payment webhook
lib/
  tmdb.ts                         Typed TMDB client (server-only)
  db.ts                           Prisma client singleton
  auth.ts                         getUser / requireUser helpers
  razorpay.ts                     Orders, refunds, HMAC signature checks
  booking/
    config.ts                     Business rules: cities, hold time, fees, seat layout
    pricing.ts                    Price calculation (pure, unit-tested)
    queries.ts                    Read queries (showtimes, seats, bookings)
    actions.ts                    Server Actions: holdSeats, verifyPayment, cancelHold
    lifecycle.ts                  Booking state machine: confirm, release, refund
  supabase/                       Browser, server and middleware clients
prisma/
  schema.prisma                   Data model
  migrations/                     SQL migrations (incl. Row Level Security)
  seed.ts                         Theaters, seats, showtimes from TMDB "now playing"
middleware.ts                     Session refresh + route protection
```

### Data model

`Movie` 1-n `Show` n-1 `Screen` n-1 `Theater`, `Screen` 1-n `Seat`, `Profile` 1-n `Booking` 1-n `BookedSeat` n-1 `Seat`

### How a booking works

```
Seat map ──holdSeats()──▶ PENDING booking (seats reserved 10 min) + Razorpay order
                │
                ▼
     Razorpay Checkout (browser)
                │ success
                ▼
verifyPayment(): HMAC signature check ──▶ CONFIRMED ──▶ QR ticket
                ▲
Razorpay webhook (payment.captured) ─┘   (same confirm function, idempotent)
```

- **No double-booking:** `booked_seats` has a unique `(showId, seatId)` constraint, so the database rejects a second hold on the same seat even if two requests arrive at the same millisecond.
- **Hold expiry:** a seat counts as taken only if its booking is `CONFIRMED`, or `PENDING` with an unexpired hold. Expired holds are cleaned up lazily inside the next booking transaction.
- **Price integrity:** totals are always computed on the server from database prices. The browser only sends seat IDs.
- **Payment integrity:** Razorpay signs `order_id|payment_id` with our secret; we verify it with a constant-time compare before confirming.
- **Late payments:** if a payment lands after the hold expired, the booking is marked `FAILED` and the payment is refunded automatically.
- **Money in paise:** all amounts are integers (₹1 = 100 paise), so there are no floating-point errors.
- **RLS on:** Supabase exposes tables over REST with the public anon key; Row Level Security is enabled on every table so that path is closed. The app uses Prisma on the server.

## Getting started

```bash
npm install
cp .env.example .env.local      # fill in the values below
npm run db:migrate              # create tables in Supabase
npm run db:seed                 # theaters, seats and a week of showtimes
npm run dev                     # http://localhost:3000
```

| Variable | Where to get it |
|---|---|
| `TMDB_API_KEY` | themoviedb.org → Settings → API |
| `TMDB_API_BASE` | `https://api.tmdb.org/3` (alternate host; some ISPs block `api.themoviedb.org`) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `DATABASE_URL`, `DIRECT_URL` | Supabase → Connect → ORMs → Prisma |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay Dashboard (Test Mode) → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Webhooks (after deploying) |
| `NEXT_PUBLIC_SITE_URL` | Your public URL |

**Test payments:** choose UPI and enter `success@razorpay`, or use a [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-details/).

**Showtimes are demo data.** TMDB has no theater schedules, so the seed script generates realistic showtimes for movies currently in Indian theaters. Re-run `npm run db:seed` to refresh the week.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (pricing, signatures, redirects, dates) |
| `npm run lint` / `npm run typecheck` | Code quality checks |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / seed data |

CI (GitHub Actions) runs lint, type-check, tests and build on every push.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add all environment variables from the table above.
3. In Supabase → Authentication → URL Configuration, set the Site URL to your Vercel URL and add `https://<your-domain>/auth/callback` to the redirect URLs.
4. In Razorpay → Webhooks, add `https://<your-domain>/api/webhooks/razorpay` with the `payment.captured` event, and put its secret in `RAZORPAY_WEBHOOK_SECRET`.

## Roadmap

- Real-time seat updates (Supabase Realtime) while another user is choosing
- Password reset, profile page, booking cancellation with partial refunds
- Scheduled job to expire holds proactively; email tickets (Resend)
- Playwright end-to-end tests for the booking flow

---

Movie data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
