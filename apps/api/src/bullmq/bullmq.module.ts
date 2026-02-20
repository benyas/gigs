import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GigIndexingProcessor } from './gig-indexing.processor';
import { NotificationProcessor } from './notification.processor';
import { MeilisearchModule } from '../meilisearch/meilisearch.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'gig-indexing' },
      { name: 'notifications' },
    ),
    MeilisearchModule,
  ],
  providers: [GigIndexingProcessor, NotificationProcessor],
  exports: [BullModule],
})
export class BullmqModule {}
