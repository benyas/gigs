import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import slugify from 'slugify';
import type { GigFiltersInput, CreateGigInput } from '@gigs/shared';

@Injectable()
export class GigsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('gig-indexing') private indexQueue: Queue,
  ) {}

  async findAll(filters: GigFiltersInput) {
    const { categoryId, cityId, minPrice, maxPrice, q, page, perPage } = filters;

    const where: Record<string, unknown> = { status: 'active' };
    if (categoryId) where.categoryId = categoryId;
    if (cityId) where.cityId = cityId;
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) (where.basePrice as Record<string, number>).gte = minPrice;
      if (maxPrice) (where.basePrice as Record<string, number>).lte = maxPrice;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

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
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
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
}
