import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    @InjectQueue('notifications') private notifQueue: Queue,
  ) {}

  async create(userId: string, bookingId: string, reason: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: true, dispute: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isClient = booking.clientId === userId;
    const isProvider = booking.gig.providerId === userId;
    if (!isClient && !isProvider) throw new ForbiddenException();

    if (booking.dispute) {
      throw new BadRequestException('A dispute already exists for this booking');
    }

    if (!['in_progress', 'completed'].includes(booking.status)) {
      throw new BadRequestException('Can only dispute bookings that are in progress or completed');
    }

    // Update booking status to disputed
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'disputed' },
    });

    const dispute = await this.prisma.dispute.create({
      data: {
        bookingId,
        initiatorId: userId,
        reason,
      },
      include: {
        booking: { include: { gig: true, client: { include: { profile: true } } } },
        initiator: { include: { profile: true } },
      },
    });

    await this.notifQueue.add('dispute-opened', {
      disputeId: dispute.id,
      bookingId,
    });

    return dispute;
  }

  async findById(disputeId: string, userId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            gig: { include: { provider: { include: { profile: true } } } },
            client: { include: { profile: true } },
          },
        },
        initiator: { include: { profile: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    // Check access
    const isClient = dispute.booking.clientId === userId;
    const isProvider = dispute.booking.gig.providerId === userId;
    const isAdmin = await this.prisma.user.findFirst({
      where: { id: userId, role: 'admin' },
    });

    if (!isClient && !isProvider && !isAdmin) throw new ForbiddenException();

    return dispute;
  }

  async addMessage(disputeId: string, userId: string, content: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: { include: { gig: true } } },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'closed') {
      throw new BadRequestException('Dispute is closed');
    }

    return this.prisma.disputeMessage.create({
      data: { disputeId, senderId: userId, content },
    });
  }

  async resolve(disputeId: string, adminId: string, resolution: string, resolveInFavorOf: 'client' | 'provider') {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: { include: { gig: true } } },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (['closed', 'resolved_client', 'resolved_provider'].includes(dispute.status)) {
      throw new BadRequestException('Dispute already resolved');
    }

    const status = resolveInFavorOf === 'client' ? 'resolved_client' : 'resolved_provider';

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: status as any,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // If resolved in client's favor, trigger refund
    if (resolveInFavorOf === 'client') {
      try {
        await this.payments.refund(dispute.bookingId, adminId);
      } catch (err) {
        // Refund may fail if no payment exists — log but don't block
      }
    }

    await this.notifQueue.add('dispute-resolved', {
      disputeId,
      status,
      bookingId: dispute.bookingId,
    });

    return updated;
  }

  async listForUser(userId: string, page: number, perPage: number) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { clientId: userId },
          { gig: { providerId: userId } },
        ],
        dispute: { isNot: null },
      },
      select: { id: true },
    });

    const bookingIds = bookings.map((b) => b.id);

    const where = { bookingId: { in: bookingIds } };

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: {
            include: {
              gig: { select: { title: true, slug: true } },
              client: { include: { profile: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async listAll(page: number, perPage: number, status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: {
          booking: {
            include: {
              gig: { select: { title: true } },
              client: { include: { profile: true } },
            },
          },
          initiator: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}
