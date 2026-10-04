# InfinityBox: Interview Cheat Sheet

## 30-second pitch
"InfinityBox is a full-stack movie platform built with Next.js 15, TypeScript, Supabase, Prisma and Razorpay. You can browse trending movies with live TMDB data, watch trailers, and book theater tickets end to end: pick a showtime, choose seats on an interactive seat map, pay with Razorpay, and get a QR e-ticket. The booking system holds seats during payment, guarantees no double-booking at the database level, verifies every payment cryptographically, and handles edge cases like late payments with automatic refunds."

## Demo script (3 minutes)
1. **Home:** rotating hero, Top 10 row, "Now Showing in Theaters" section
2. **Sign in:** with Google or email (poster-wall login page)
3. **Book:** Tickets → pick a movie → change city/date → note the availability colours
4. **Seats:** pick 2–3 seats across tiers; the price updates live; Proceed
5. **Checkout:** point out the 10-minute hold timer; pay with UPI `success@razorpay`
6. **Ticket:** confetti, QR code, print; then My Bookings
7. **Bonus:** open the same show in another browser, try to book the seats you just bought → "just booked by someone else"

---

## Architecture questions

**Walk me through the stack.**
- Next.js App Router: Server Components render data on the server; client components only for interactivity (seat map, navbar, carousel).
- Supabase handles auth (email/password and Google OAuth) and hosts Postgres.
- Prisma is the type-safe ORM; schema in `prisma/schema.prisma`, SQL migrations committed in `prisma/migrations`.
- Razorpay processes payments; TMDB provides movie data.

**Why Server Actions instead of REST API routes?**
Booking mutations (`holdSeats`, `verifyPayment`, `cancelHold`) are Server Actions in `lib/booking/actions.ts`. They're type-safe end to end (no hand-written fetch or JSON contracts), run only on the server, and Next.js protects them against CSRF. The one real API route is the Razorpay webhook, because Razorpay calls it from outside.

**How is auth enforced?**
Three layers:
1. `middleware.ts` refreshes the Supabase session cookie and redirects guests away from `/book/show`, `/checkout` and `/bookings`.
2. Every protected page calls `requireUser()`.
3. Every server action checks the user again and scopes queries by `userId`, so nobody can view or pay for someone else's booking even with its ID.

**Why `getUser()` and not `getSession()` on the server?**
`getUser()` validates the JWT with Supabase; `getSession()` just trusts the cookie. Server-side decisions must use the validated one.

**What's the `next` redirect protection?**
`safeNext()` only allows same-site paths, so `/login?next=https://evil.com` can't bounce users to a phishing site (an open-redirect attack). It's unit-tested.

---

## Booking system questions (expect these!)

**How do you prevent two people booking the same seat?**
Two layers:
1. **Seat holds:** choosing seats creates a `PENDING` booking with `holdExpiresAt = now + 10 min`. While that's active, those seats show as taken for everyone else.
2. **Database guarantee:** the `booked_seats` table has a **unique constraint on (showId, seatId)**. If two requests race for the same seat at the same millisecond, Postgres accepts exactly one; the other gets error `P2002`, which we turn into "Sorry, some of those seats were just booked."

App-level checks alone ("is the seat free? then insert") have a race window between the check and the insert. The constraint closes it.

**What happens if a user holds seats and leaves?**
The hold just expires; a seat only counts as taken if its booking is `CONFIRMED`, or `PENDING` with a hold that hasn't expired. Expired holds are cleaned up lazily inside the next booking transaction for that show, so no cron job is needed for correctness. (A scheduled cleanup would be a nice addition.)

**Can a user change the price?**
No. The browser only sends seat IDs. `holdSeats` loads the seats and show prices from the database and calculates the total on the server (`calculateTotals` in `pricing.ts`). The Razorpay order is created server-side for that amount.

**How do you know a payment is real?**
After checkout, Razorpay returns `order_id`, `payment_id` and a `signature`, which is an HMAC-SHA256 of `order_id|payment_id` using our secret key. Only Razorpay and our server know the secret. `verifyPaymentSignature` recomputes it and compares with `timingSafeEqual` (constant time, so attackers can't learn the signature byte by byte through timing). We also check that the order ID belongs to this user's booking.

**What if the user pays and closes the browser before the callback?**
The **webhook** (`/api/webhooks/razorpay`) receives `payment.captured` directly from Razorpay and confirms the booking. Both paths call the same `confirmBooking()`.

**Won't the webhook and the callback confirm twice?**
`confirmBooking` is **idempotent**: it runs `UPDATE ... WHERE id = ? AND status = 'PENDING'`, which is atomic. The first caller flips it to `CONFIRMED`; the second updates zero rows and just returns the booking.

**What if payment arrives after the hold expired and someone else took the seats?**
`confirmBooking` sees the booking is no longer `PENDING`, marks it `FAILED`, and calls Razorpay's refund API. The user sees a "Payment refunded" page.

**Why store money in paise?**
Floating point can't represent 0.1 exactly (0.1 + 0.2 = 0.30000000000000004). Integers in the smallest unit avoid rounding bugs. Razorpay also expects paise.

**Explain the booking states.**
`PENDING` → `CONFIRMED` (paid) · `EXPIRED` (hold timed out or replaced) · `CANCELLED` (user released seats) · `FAILED` (late payment, refunded). All transitions live in `lib/booking/lifecycle.ts`.

**Where do theaters and showtimes come from?**
TMDB has no showtime data, so `prisma/seed.ts` takes TMDB's "now playing in India" list and generates 12 fictional theaters across 4 cities, 24 screens with 164 seats each, a week of showtimes, and random realistic occupancy. In a real product this would come from theater partners' APIs.

**What's Row Level Security and why did you enable it?**
Supabase automatically exposes tables over a REST API using the *public* anon key. Without RLS, anyone could read or modify bookings with that key. I enabled RLS on every table with no policies, which blocks that path entirely; the app talks to Postgres through Prisma on the server, which isn't affected.

---

## Frontend questions

**How did you make it feel premium?**
A design system in `globals.css` (colour tokens, `.btn`/`.card`/`.chip` classes), Motion animations (hero crossfade, navbar pill, seat pop, sliding checkout bar), skeleton loaders, toasts, and designed empty and error states.

**Performance?**
Server rendering, ISR caching (browse pages rebuild hourly), streaming rows with Suspense, lazy YouTube embeds, `next/image` with fixed aspect ratios (no layout shift), and middleware only on auth routes so browse pages stay static.

**Accessibility?**
Seats are real buttons with labels like "Seat E7, Premium, ₹250", `aria-pressed` for selection, keyboard focus rings, a skip link, `aria-current` on nav and steps, and `prefers-reduced-motion` support.

**Timezones?**
Showtimes are stored in UTC and always displayed in IST (`Asia/Kolkata`). Date grouping ("Today", "Tomorrow") uses the IST calendar day, so a 1 AM show isn't filed under the previous day. There are unit tests for this.

---

## Testing & quality
- **Vitest unit tests (20):** pricing, booking codes, Razorpay signature verification (valid, tampered, wrong secret), open-redirect protection, IST date logic.
- **GitHub Actions CI:** lint → type-check → tests → build on every push.
- **Strict TypeScript, zod validation** on every server action input.
- **0 npm audit vulnerabilities** in production dependencies.

## What I'd build next
- Supabase Realtime so seat maps update live while others book
- Playwright end-to-end tests of the full booking flow
- Email tickets, password reset, cancellations with partial refunds
- A scheduled job to expire holds proactively and an admin dashboard for theaters

## Honest trade-offs (if asked "what would you improve?")
- Showtimes are seeded demo data, not a real theater feed.
- Hold cleanup is lazy (correct, but expired rows sit until the next booking).
- My List lives in localStorage; moving it to the database would sync it across devices.
- The QR encodes the booking code; in production it should be a signed token verified at the gate.
