import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileInput } from '@gigs/shared';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { city: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile: user.profile,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const profileData: Record<string, unknown> = {};
    if (data.name !== undefined) profileData.name = data.name;
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.cityId !== undefined) profileData.cityId = data.cityId;

    const userData: Record<string, unknown> = {};
    if (data.phone !== undefined) userData.phone = data.phone;

    if (Object.keys(profileData).length > 0) {
      await this.prisma.profile.update({
        where: { userId },
        data: profileData,
      });
    }

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    return this.getProfile(userId);
  }

  async getProviderPublicProfile(providerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: providerId },
      include: {
        profile: { include: { city: true } },
        gigs: {
          where: { status: 'active' },
          include: { category: true, city: true, media: { take: 1 } },
          orderBy: { createdAt: 'desc' },
        },
        reviewsReceived: {
          include: {
            client: { include: { profile: true } },
            booking: { include: { gig: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user || user.role !== 'provider') {
      throw new NotFoundException('Prestataire non trouvé');
    }

    return {
      id: user.id,
      profile: user.profile,
      gigs: user.gigs,
      reviews: user.reviewsReceived,
      memberSince: user.createdAt,
    };
  }
}
