-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" UUID;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "provider_reply" TEXT,
ADD COLUMN     "provider_reply_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availabilities_provider_id_idx" ON "availabilities"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_provider_id_day_of_week_key" ON "availabilities"("provider_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
