import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- Stats ---
  async getStats() {
    const [users, gigs, bookings, reviews] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.gig.count(),
      this.prisma.booking.count(),
      this.prisma.review.count(),
    ]);

    const [clients, providers, admins] = await Promise.all([
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.user.count({ where: { role: 'provider' } }),
      this.prisma.user.count({ where: { role: 'admin' } }),
    ]);

    const [pendingBookings, completedBookings, activeGigs] = await Promise.all([
      this.prisma.booking.count({ where: { status: 'pending' } }),
      this.prisma.booking.count({ where: { status: 'completed' } }),
      this.prisma.gig.count({ where: { status: 'active' } }),
    ]);

    const recentBookings = await this.prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        gig: true,
        client: { include: { profile: true } },
      },
    });

    return {
      users: { total: users, clients, providers, admins },
      gigs: { total: gigs, active: activeGigs },
      bookings: { total: bookings, pending: pendingBookings, completed: completedBookings },
      reviews: { total: reviews },
      recentBookings,
    };
  }

  // --- Users ---
  async listUsers(page: number, perPage: number, role?: string, q?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { profile: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true, _count: { select: { gigs: true, bookingsAsClient: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      include: { profile: true },
    });
  }

  async verifyUser(userId: string, verified: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.profile) throw new NotFoundException('User or profile not found');

    return this.prisma.profile.update({
      where: { userId },
      data: { isVerified: verified },
    });
  }

  // --- Gigs ---
  async listAllGigs(page: number, perPage: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.gig.findMany({
        where,
        include: {
          provider: { include: { profile: true } },
          category: true,
          city: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.gig.count({ where }),
    ]);

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  async updateGigStatus(gigId: string, status: string) {
    const gig = await this.prisma.gig.findUnique({ where: { id: gigId } });
    if (!gig) throw new NotFoundException('Gig not found');

    return this.prisma.gig.update({
      where: { id: gigId },
      data: { status: status as any },
      include: { provider: { include: { profile: true } }, category: true, city: true },
    });
  }

  // --- Bookings ---
  async listAllBookings(page: number, perPage: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          gig: { include: { provider: { include: { profile: true } } } },
          client: { include: { profile: true } },
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  // --- Categories ---
  async createCategory(data: { name: string; slug: string; icon: string }) {
    return this.prisma.category.create({ data });
  }

  async updateCategory(id: string, data: { name?: string; slug?: string; icon?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const gigsCount = await this.prisma.gig.count({ where: { categoryId: id } });
    if (gigsCount > 0) {
      throw new NotFoundException(`Cannot delete category with ${gigsCount} active gigs`);
    }
    return this.prisma.category.delete({ where: { id } });
  }

  // --- Cities ---
  async createCity(data: { name: string; region: string }) {
    return this.prisma.city.create({ data });
  }

  async updateCity(id: string, data: { name?: string; region?: string }) {
    return this.prisma.city.update({ where: { id }, data });
  }

  async deleteCity(id: string) {
    const gigsCount = await this.prisma.gig.count({ where: { cityId: id } });
    if (gigsCount > 0) {
      throw new NotFoundException(`Cannot delete city with ${gigsCount} active gigs`);
    }
    return this.prisma.city.delete({ where: { id } });
  }
}
