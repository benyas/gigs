import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class CitiesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll() {
    const cached = await this.cache.get('cities:all');
    if (cached) return cached;

    const data = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });

    await this.cache.set('cities:all', data, 300);
    return data;
  }
}
