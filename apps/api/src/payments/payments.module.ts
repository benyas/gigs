import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CmiProvider } from './cmi.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { BullmqModule } from '../bullmq/bullmq.module';

@Module({
  imports: [PrismaModule, BullmqModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CmiProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
