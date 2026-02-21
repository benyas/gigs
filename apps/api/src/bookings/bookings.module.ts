import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { CalendarService } from './calendar.service';
import { BullmqModule } from '../bullmq/bullmq.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [BullmqModule, PaymentsModule],
  controllers: [BookingsController],
  providers: [BookingsService, InvoiceService, CalendarService],
  exports: [CalendarService],
})
export class BookingsModule {}
