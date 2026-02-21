import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId, referredId: null },
    });

    if (existing) return { code: existing.code };

    const code = `GIG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await this.prisma.referral.create({
      data: { referrerId: userId, code },
    });

    return { code };
  }

  async applyCode(code: string, userId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { code } });
    if (!referral) throw new BadRequestException('Invalid referral code');
    if (referral.referrerId === userId) throw new BadRequestException('Cannot use your own referral code');

    // Check if user already used a referral
    const alreadyReferred = await this.prisma.referral.findFirst({
      where: { referredId: userId },
    });
    if (alreadyReferred) throw new BadRequestException('Already used a referral code');

    // If this referral already has a referred user, create a new one for this link
    if (referral.referredId) {
      await this.prisma.referral.create({
        data: {
          referrerId: referral.referrerId,
          referredId: userId,
          code: `${code}-${Date.now()}`,
          rewardAmount: 20, // 20 MAD reward
        },
      });
    } else {
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: { referredId: userId, rewardAmount: 20 },
      });
    }

    return { success: true, message: 'Referral code applied' };
  }

  async getMyReferrals(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId, referredId: { not: null } },
      include: {
        referred: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: referrals.length,
      totalReward: referrals.reduce((sum, r) => sum + r.rewardAmount, 0),
      paid: referrals.filter((r) => r.rewardPaid).length,
    };

    return { referrals, stats };
  }
}
