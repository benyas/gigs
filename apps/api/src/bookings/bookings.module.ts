import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BullmqModule } from '../bullmq/bullmq.module';

@Module({
  imports: [BullmqModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
