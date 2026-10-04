-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SeatTier" AS ENUM ('RECLINER', 'PREMIUM', 'REGULAR');

-- CreateEnum
CREATE TYPE "ShowFormat" AS ENUM ('TWO_D', 'THREE_D', 'IMAX');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "runtime" INTEGER,
    "genres" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL,
    "language" TEXT NOT NULL,
    "releaseDate" TEXT,
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theaters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amenities" TEXT[],

    CONSTRAINT "theaters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screens" (
    "id" TEXT NOT NULL,
    "theaterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "tier" "SeatTier" NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shows" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "movieId" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "format" "ShowFormat" NOT NULL DEFAULT 'TWO_D',
    "language" TEXT NOT NULL,
    "priceRecliner" INTEGER NOT NULL,
    "pricePremium" INTEGER NOT NULL,
    "priceRegular" INTEGER NOT NULL,

    CONSTRAINT "shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "showId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL,
    "convenienceFee" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "holdExpiresAt" TIMESTAMP(3) NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booked_seats" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "booked_seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "theaters_city_idx" ON "theaters"("city");

-- CreateIndex
CREATE UNIQUE INDEX "screens_theaterId_name_key" ON "screens"("theaterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "seats_screenId_row_number_key" ON "seats"("screenId", "row", "number");

-- CreateIndex
CREATE INDEX "shows_movieId_startsAt_idx" ON "shows"("movieId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_razorpayOrderId_key" ON "bookings"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_razorpayPaymentId_key" ON "bookings"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_showId_status_idx" ON "bookings"("showId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booked_seats_showId_seatId_key" ON "booked_seats"("showId", "seatId");

-- AddForeignKey
ALTER TABLE "screens" ADD CONSTRAINT "screens_theaterId_fkey" FOREIGN KEY ("theaterId") REFERENCES "theaters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booked_seats" ADD CONSTRAINT "booked_seats_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booked_seats" ADD CONSTRAINT "booked_seats_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booked_seats" ADD CONSTRAINT "booked_seats_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Supabase exposes the public schema through its REST API using the public
-- anon key. Enabling Row Level Security with no policies blocks that path
-- entirely; the app talks to Postgres directly via Prisma (which bypasses RLS).
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "theaters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "screens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "booked_seats" ENABLE ROW LEVEL SECURITY;
