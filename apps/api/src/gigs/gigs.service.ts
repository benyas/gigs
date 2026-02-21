import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import slugify from 'slugify';
import type { GigFiltersInput, CreateGigInput } from '@gigs/shared';

@Injectable()
export class GigsService {
  private readonly logger = new Logger(GigsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private meili: MeilisearchService,
    @InjectQueue('gig-indexing') private indexQueue: Queue,
  ) {}

  private getSortOrder(sort?: string): Record<string, string>[] {
    switch (sort) {
      case 'price_asc': return [{ basePrice: 'asc' }];
      case 'price_desc': return [{ basePrice: 'desc' }];
      case 'rating': return [{ provider: { profile: { ratingAvg: 'desc' } } } as any];
      default: return [{ createdAt: 'desc' }];
    }
  }

  async findAll(filters: GigFiltersInput) {
    const { categoryId, cityId, minPrice, maxPrice, q, sort, page, perPage } = filters;

    // Use Meilisearch when there's a text query
    if (q) {
      return this.searchWithMeilisearch(filters);
    }

    const where: Record<string, unknown> = { status: 'active' };
    if (categoryId) where.categoryId = categoryId;
    if (cityId) where.cityId = cityId;
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) (where.basePrice as Record<string, number>).gte = minPrice;
      if (maxPrice) (where.basePrice as Record<string, number>).lte = maxPrice;
    }

    const orderBy = this.getSortOrder(sort);

    const [data, total] = await Promise.all([
      this.prisma.gig.findMany({
        where,
        include: {
          provider: { include: { profile: true } },
          category: true,
          city: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.gig.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  private async searchWithMeilisearch(filters: GigFiltersInput) {
    const { categoryId, cityId, minPrice, maxPrice, q, page, perPage } = filters;

    const meiliFilters: string[] = ['status = "active"'];
    if (categoryId) meiliFilters.push(`categoryId = "${categoryId}"`);
    if (cityId) meiliFilters.push(`cityId = "${cityId}"`);
    if (minPrice) meiliFilters.push(`basePrice >= ${minPrice}`);
    if (maxPrice) meiliFilters.push(`basePrice <= ${maxPrice}`);

    try {
      const results = await this.meili.search(q || '', {
        filter: meiliFilters,
        limit: perPage,
        offset: (page - 1) * perPage,
      });

      // Hydrate results from DB with full relations
      const ids = results.hits.map((hit: any) => hit.id);
      if (ids.length === 0) {
        return { data: [], meta: { page, perPage, total: 0, totalPages: 0 } };
      }

      const gigs = await this.prisma.gig.findMany({
        where: { id: { in: ids } },
        include: {
          provider: { include: { profile: true } },
          category: true,
          city: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      });

      // Preserve Meilisearch relevance order
      const gigMap = new Map(gigs.map((g) => [g.id, g]));
      const ordered = ids.map((id: string) => gigMap.get(id)).filter(Boolean);

      const total = results.estimatedTotalHits || ids.length;
      return {
        data: ordered,
        meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    } catch (err) {
      this.logger.warn('Meilisearch unavailable, falling back to DB search');
      // Fallback to DB text search
      const where: Record<string, unknown> = {
        status: 'active',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      };
      if (categoryId) where.categoryId = categoryId;
      if (cityId) where.cityId = cityId;

      const [data, total] = await Promise.all([
        this.prisma.gig.findMany({
          where,
          include: {
            provider: { include: { profile: true } },
            category: true,
            city: true,
            media: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        this.prisma.gig.count({ where }),
      ]);
      return {
        data,
        meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    }
  }

  async findByProvider(providerId: string) {
    const data = await this.prisma.gig.findMany({
      where: { providerId },
      include: {
        category: true,
        city: true,
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return data;
  }

  async findBySlug(slug: string) {
    const gig = await this.prisma.gig.findUnique({
      where: { slug },
      include: {
        provider: { include: { profile: true } },
        category: true,
        city: true,
        media: { orderBy: { sortOrder: 'asc' } },
        bookings: {
          include: {
            review: true,
          },
          where: { status: 'completed' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!gig) {
      throw new NotFoundException('Gig not found');
    }

    return gig;
  }

  async create(providerId: string, data: CreateGigInput) {
    const baseSlug = slugify(data.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.gig.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const gig = await this.prisma.gig.create({
      data: {
        providerId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        description: data.description,
        basePrice: data.basePrice,
        cityId: data.cityId,
        status: 'active',
      },
      include: {
        provider: { include: { profile: true } },
        category: true,
        city: true,
      },
    });

    await this.indexQueue.add('reindex-gig', { gigId: gig.id });

    return gig;
  }

  async update(gigId: string, providerId: string, data: Partial<CreateGigInput>) {
    const gig = await this.prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) throw new NotFoundException('Gig not found');
    if (gig.providerId !== providerId) throw new ForbiddenException();

    const updateData: Record<string, unknown> = { ...data };
    if (data.title) {
      const baseSlug = slugify(data.title, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await this.prisma.gig.findUnique({ where: { slug } });
        if (!existing || existing.id === gigId) break;
        slug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = slug;
    }

    const updated = await this.prisma.gig.update({
      where: { id: gigId },
      data: updateData,
      include: {
        provider: { include: { profile: true } },
        category: true,
        city: true,
      },
    });

    await this.indexQueue.add('reindex-gig', { gigId: updated.id });

    return updated;
  }

  async addMedia(gigId: string, providerId: string, files: Express.Multer.File[]) {
    const gig = await this.prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) throw new NotFoundException('Gig not found');
    if (gig.providerId !== providerId) throw new ForbiddenException();

    const currentCount = await this.prisma.gigMedia.count({ where: { gigId } });

    const uploaded = await this.storage.uploadMultiple(files, `gigs/${gigId}`);

    const media = await Promise.all(
      uploaded.map((file, i) =>
        this.prisma.gigMedia.create({
          data: {
            gigId,
            url: file.url,
            sortOrder: currentCount + i,
          },
        }),
      ),
    );

    return media;
  }

  async removeMedia(gigId: string, mediaId: string, providerId: string) {
    const gig = await this.prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) throw new NotFoundException('Gig not found');
    if (gig.providerId !== providerId) throw new ForbiddenException();

    const media = await this.prisma.gigMedia.findFirst({
      where: { id: mediaId, gigId },
    });
    if (!media) throw new NotFoundException('Media not found');

    // Extract key from URL for S3 deletion
    const urlParts = media.url.split('/');
    const key = urlParts.slice(-2).join('/');
    await this.storage.delete(key).catch(() => {});

    await this.prisma.gigMedia.delete({ where: { id: mediaId } });

    return { deleted: true };
  }
}
