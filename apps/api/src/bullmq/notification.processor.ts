import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job) {
    // Stub: no SMS/push provider integrated yet
    this.logger.log(
      `[STUB] Notification job "${job.name}" — data: ${JSON.stringify(job.data)}`,
    );

    // In production, switch on job.name:
    // 'booking-created' → SMS/push to provider
    // 'booking-status-changed' → SMS/push to relevant party
  }
}
