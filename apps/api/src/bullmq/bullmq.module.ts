import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GigIndexingProcessor } from './gig-indexing.processor';
import { NotificationProcessor } from './notification.processor';
import { MeilisearchModule } from '../meilisearch/meilisearch.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/email.service';
import { MoroccanSmsProvider } from '../common/sms.provider';
import { PushService } from '../common/push.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'gig-indexing' },
      { name: 'notifications' },
    ),
    MeilisearchModule,
    PrismaModule,
  ],
  providers: [
    GigIndexingProcessor,
    NotificationProcessor,
    EmailService,
    MoroccanSmsProvider,
    PushService,
  ],
  exports: [BullModule],
})
export class BullmqModule {}
