import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';

@Processor('gig-indexing')
export class GigIndexingProcessor extends WorkerHost {
  private readonly logger = new Logger(GigIndexingProcessor.name);

  constructor(
    private prisma: PrismaService,
    private meili: MeilisearchService,
  ) {
    super();
  }

  async process(job: Job<{ gigId: string }>) {
    this.logger.log(`Reindexing gig ${job.data.gigId}`);

    const gig = await this.prisma.gig.findUnique({
      where: { id: job.data.gigId },
      include: {
        category: true,
        city: true,
        provider: { include: { profile: true } },
      },
    });

    if (!gig) {
      this.logger.warn(`Gig ${job.data.gigId} not found, skipping`);
      return;
    }

    await this.meili.indexGig({
      id: gig.id,
      title: gig.title,
      slug: gig.slug,
      description: gig.description,
      basePrice: gig.basePrice,
      status: gig.status,
      categoryId: gig.categoryId,
      categoryName: gig.category.name,
      cityId: gig.cityId,
      cityName: gig.city.name,
      providerName: gig.provider.profile?.name || '',
      createdAt: gig.createdAt.getTime(),
    });

    this.logger.log(`Gig ${job.data.gigId} reindexed successfully`);
  }
}
