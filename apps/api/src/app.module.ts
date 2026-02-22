import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CitiesModule } from './cities/cities.module';
import { GigsModule } from './gigs/gigs.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MeilisearchModule } from './meilisearch/meilisearch.module';
import { BullmqModule } from './bullmq/bullmq.module';
import { StorageModule } from './storage/storage.module';
import { ProfileModule } from './profile/profile.module';
import { AdminModule } from './admin/admin.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AvailabilityModule } from './availability/availability.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { VerificationModule } from './verification/verification.module';
import { DisputesModule } from './disputes/disputes.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PushModule } from './push/push.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReferralsModule } from './referrals/referrals.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    CacheModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    CitiesModule,
    GigsModule,
    BookingsModule,
    ReviewsModule,
    MeilisearchModule,
    BullmqModule,
    StorageModule,
    ProfileModule,
    AdminModule,
    MessagingModule,
    NotificationsModule,
    AvailabilityModule,
    HealthModule,
    PaymentsModule,
    VerificationModule,
    DisputesModule,
    FavoritesModule,
    PushModule,
    CouponsModule,
    ReferralsModule,
    PortfolioModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
