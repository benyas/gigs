import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll() {
    const cached = await this.cache.get('categories:all');
    if (cached) return cached;

    const data = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { gigs: true } },
      },
    });

    await this.cache.set('categories:all', data, 300);
    return data;
  }
}
