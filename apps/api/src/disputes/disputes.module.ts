import { Module } from '@nestjs/common';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { BullmqModule } from '../bullmq/bullmq.module';

@Module({
  imports: [PrismaModule, PaymentsModule, BullmqModule],
  controllers: [DisputesController],
  providers: [DisputesService],
})
export class DisputesModule {}
