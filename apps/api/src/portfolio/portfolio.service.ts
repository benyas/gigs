import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async list(providerId: string) {
    return this.prisma.portfolioItem.findMany({
      where: { providerId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(providerId: string, title: string, description: string | undefined, file: Express.Multer.File) {
    const uploaded = await this.storage.uploadMultiple([file], `portfolio/${providerId}`);
    const count = await this.prisma.portfolioItem.count({ where: { providerId } });

    return this.prisma.portfolioItem.create({
      data: {
        providerId,
        title,
        description,
        imageUrl: uploaded[0].url,
        sortOrder: count,
      },
    });
  }

  async update(itemId: string, providerId: string, data: { title?: string; description?: string; sortOrder?: number }) {
    const item = await this.prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Portfolio item not found');
    if (item.providerId !== providerId) throw new ForbiddenException();

    return this.prisma.portfolioItem.update({
      where: { id: itemId },
      data,
    });
  }

  async remove(itemId: string, providerId: string) {
    const item = await this.prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Portfolio item not found');
    if (item.providerId !== providerId) throw new ForbiddenException();

    await this.prisma.portfolioItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }
}
