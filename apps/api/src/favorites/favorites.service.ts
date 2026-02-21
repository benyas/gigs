import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, gigId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_gigId: { userId, gigId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({ data: { userId, gigId } });
    return { favorited: true };
  }

  async list(userId: string, page: number, perPage: number) {
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        include: {
          gig: {
            include: {
              provider: { include: { profile: true } },
              category: true,
              city: true,
              media: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.favorite.count({ where }),
    ]);

    return {
      data: data.map((f) => ({ ...f.gig, favoritedAt: f.createdAt })),
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async isFavorited(userId: string, gigId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_gigId: { userId, gigId } },
    });
    return { favorited: !!fav };
  }
}
