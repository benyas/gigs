-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('client', 'provider', 'admin');

-- CreateEnum
CREATE TYPE "GigStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "city_id" UUID,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gigs" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "city_id" UUID NOT NULL,
    "status" "GigStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gig_media" (
    "id" UUID NOT NULL,
    "gig_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gig_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "gig_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_city_id_idx" ON "profiles"("city_id");

-- CreateIndex
CREATE INDEX "profiles_rating_avg_idx" ON "profiles"("rating_avg");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE INDEX "cities_region_idx" ON "cities"("region");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "gigs_slug_key" ON "gigs"("slug");

-- CreateIndex
CREATE INDEX "gigs_provider_id_idx" ON "gigs"("provider_id");

-- CreateIndex
CREATE INDEX "gigs_category_id_idx" ON "gigs"("category_id");

-- CreateIndex
CREATE INDEX "gigs_city_id_idx" ON "gigs"("city_id");

-- CreateIndex
CREATE INDEX "gigs_status_idx" ON "gigs"("status");

-- CreateIndex
CREATE INDEX "gigs_base_price_idx" ON "gigs"("base_price");

-- CreateIndex
CREATE INDEX "gigs_created_at_idx" ON "gigs"("created_at");

-- CreateIndex
CREATE INDEX "gig_media_gig_id_idx" ON "gig_media"("gig_id");

-- CreateIndex
CREATE INDEX "bookings_gig_id_idx" ON "bookings"("gig_id");

-- CreateIndex
CREATE INDEX "bookings_client_id_idx" ON "bookings"("client_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_scheduled_at_idx" ON "bookings"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_provider_id_idx" ON "reviews"("provider_id");

-- CreateIndex
CREATE INDEX "reviews_client_id_idx" ON "reviews"("client_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gig_media" ADD CONSTRAINT "gig_media_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
