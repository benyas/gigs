import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, orderValue: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });

    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      throw new BadRequestException(`Minimum order value is ${coupon.minOrderValue} MAD`);
    }

    const discount = coupon.discountType === 'percentage'
      ? Math.min(orderValue * (coupon.discountValue / 100), orderValue)
      : Math.min(coupon.discountValue, orderValue);

    return { valid: true, discount, coupon };
  }

  async use(code: string) {
    await this.prisma.coupon.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }

  // Admin CRUD
  async create(data: {
    code: string; discountType: string; discountValue: number;
    maxUses?: number; minOrderValue?: number; expiresAt?: string;
  }) {
    return this.prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses,
        minOrderValue: data.minOrderValue,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async list(page: number, perPage: number) {
    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.coupon.count(),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async update(id: string, data: Partial<{ isActive: boolean; maxUses: number; expiresAt: string }>) {
    const updateData: Record<string, unknown> = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);

    return this.prisma.coupon.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }
}
