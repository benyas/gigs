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

@Module({
  imports: [
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
