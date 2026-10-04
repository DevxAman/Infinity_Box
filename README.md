# 🎬 InfinityBox

> **Discover. Watch. Book. Curate.**
>
> InfinityBox is an all-in-one cinematic hub that brings movie discovery, trailer streaming, cinema ticket booking, and personalized watchlists together in one modern web experience.

## ✨ Features

### 🎞️ Movie Discovery
- Browse movies and TV content
- Search for titles
- Explore detailed movie information
- Discover posters, backdrops, genres, and related content
- Explore cinematic content through a responsive interface

### ▶️ Trailer Experience
- Watch movie trailers directly in the application
- Preview titles before deciding what to watch
- Dedicated cinematic title pages

### 🎟️ Cinema Ticket Booking
- Browse available movie shows
- Select a show
- Choose seats
- Review ticket pricing and order details
- Complete checkout
- View booking details and previous bookings

### 💳 Razorpay Payments
InfinityBox integrates Razorpay into the cinema booking workflow.

```text
Movie
  ↓
Show Selection
  ↓
Seat Selection
  ↓
Order Summary
  ↓
Razorpay Checkout
  ↓
Payment Verification
  ↓
Booking Confirmation
```

### ❤️ Personalized Watchlists
- Add movies to a personal watchlist
- Remove saved titles
- Access saved content through a dedicated My List experience
- Keep track of what you want to watch

### 🔐 Authentication
Authentication is handled through Supabase.

- Sign up
- Login
- Authentication callbacks
- Session-aware application experience
- User-specific watchlists
- User-specific bookings

### 📱 Responsive Experience
InfinityBox is designed to provide a consistent experience across desktop, tablet, and mobile screen sizes.

---

## 🧠 The Idea

Movie discovery and cinema booking are often split across multiple services.

InfinityBox combines the journey into a single flow:

```text
Discover
   ↓
Explore
   ↓
Watch Trailer
   ↓
Add to Watchlist
   ↓
Choose Show
   ↓
Select Seats
   ↓
Pay
   ↓
Booking Confirmation
```

**One platform. One cinematic journey.**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Authentication | Supabase |
| Database | PostgreSQL / Prisma |
| ORM | Prisma |
| Movie Data | TMDB |
| Payments | Razorpay |
| Testing | Vitest |
| Package Manager | npm |

---

## 🏗️ Application Architecture

```text
┌──────────────────────────────────────────────┐
│                  InfinityBox                 │
├──────────────────────────────────────────────┤
│                                              │
│             Next.js App Router              │
│                      │                       │
│       ┌──────────────┼──────────────┐        │
│       ↓              ↓              ↓        │
│   Discovery       Accounts       Booking     │
│       │              │              │        │
│       └──────────────┼──────────────┘        │
│                      ↓                       │
│             Server Actions / APIs            │
│                      │                       │
│       ┌──────────────┼──────────────┐        │
│       ↓              ↓              ↓        │
│      TMDB         Supabase        Razorpay   │
│                      │                       │
│                   Prisma                     │
│                      │                       │
│                  PostgreSQL                  │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```text
InfinityBox/
│
├── app/
│   ├── api/
│   ├── auth/
│   ├── book/
│   ├── bookings/
│   ├── checkout/
│   ├── login/
│   ├── movies/
│   ├── my-list/
│   ├── search/
│   ├── signup/
│   ├── tickets/
│   └── tv/
│
├── components/
│   ├── auth/
│   └── booking/
│
├── lib/
│   ├── booking/
│   ├── supabase/
│   ├── auth.ts
│   ├── db.ts
│   ├── my-list.ts
│   ├── razorpay.ts
│   ├── tmdb.ts
│   └── utils.ts
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── test/
│
├── middleware.ts
├── next.config.ts
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js installed
- npm
- Git
- A Supabase project
- TMDB API credentials
- Razorpay credentials

### 1. Clone the repository

```bash
git clone https://github.com/DevxAman/Infinity_Box.git
cd InfinityBox
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure the required environment variables in `.env.local`.

Example:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

TMDB_API_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

> Never commit `.env.local` or private production credentials to Git.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

If seed data is configured:

```bash
npx prisma db seed
```

### 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Testing

Run the test suite with:

```bash
npm test
```

For additional project validation:

```bash
npm run lint
npm run typecheck
```

---

## 🔄 Booking Flow

The booking system follows a structured lifecycle:

```text
Browse Movie
     ↓
Select Show
     ↓
Select Seats
     ↓
Review Order
     ↓
Create Payment Order
     ↓
Razorpay Checkout
     ↓
Verify Payment
     ↓
Confirm Booking
     ↓
Booking Details
```

Payment verification and booking state transitions are handled through the application's server-side workflow.

---

## 🔌 Integrations

### TMDB

TMDB provides movie and entertainment data used throughout the discovery experience.

### Supabase

Supabase is used for authentication and backend services.

### Prisma

Prisma provides type-safe database access and migration management.

### Razorpay

Razorpay is integrated into the ticket payment and checkout workflow.

---

## 🔐 Security

Sensitive configuration is kept outside the source repository.

Local environment files such as:

```text
.env
.env.local
.env.production
.env.*.local
```

should not be committed.

Use environment variables for API keys, database credentials, payment secrets, and other private configuration.

---

## 📈 Roadmap

Potential future improvements include:

- [ ] Advanced movie recommendations
- [ ] Personalized recommendation engine
- [ ] More cinema locations and shows
- [ ] Booking cancellation and refund workflows
- [ ] Digital ticket / QR code generation
- [ ] Movie ratings and reviews
- [ ] Booking notifications
- [ ] Enhanced personalization
- [ ] Progressive Web App support

---

## 🤝 Contributing

Contributions and improvements are welcome.

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes, then:

```bash
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Open a Pull Request once your changes are ready for review.

---

## 📄 License

This project is currently intended for educational and portfolio purposes.

---

## 👨‍💻 Author

**DevxAman**

GitHub: https://github.com/DevxAman

---

## ⭐ InfinityBox

**Your cinematic journey, all in one place.**

Built with Next.js, TypeScript, Prisma, Supabase, TMDB, and Razorpay.
