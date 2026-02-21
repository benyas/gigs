import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { CreateBookingInput } from '@gigs/shared';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notifQueue: Queue,
  ) {}

  async create(clientId: string, data: CreateBookingInput) {
    const gig = await this.prisma.gig.findUnique({
      where: { id: data.gigId },
    });

    if (!gig) throw new NotFoundException('Gig not found');
    if (gig.status !== 'active') throw new BadRequestException('Gig is not available');
    if (gig.providerId === clientId) {
      throw new BadRequestException('Cannot book your own gig');
    }

    const booking = await this.prisma.booking.create({
      data: {
        gigId: data.gigId,
        clientId,
        scheduledAt: new Date(data.scheduledAt),
        address: data.address,
        notes: data.notes,
        totalPrice: gig.basePrice,
      },
      include: {
        gig: { include: { provider: { include: { profile: true } } } },
        client: { include: { profile: true } },
      },
    });

    await this.notifQueue.add('booking-created', {
      bookingId: booking.id,
      providerId: gig.providerId,
      clientId,
    });

    return booking;
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    status: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isProvider = booking.gig.providerId === userId;
    const isClient = booking.clientId === userId;

    if (!isProvider && !isClient) throw new ForbiddenException();

    // Status transition validation
    const allowedTransitions: Record<string, string[]> = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'disputed'],
      completed: [],
      cancelled: [],
      disputed: [],
    };

    const allowed = allowedTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${status}`,
      );
    }

    // Only providers can accept/start, only clients can cancel before acceptance
    if (['accepted', 'in_progress', 'completed'].includes(status) && !isProvider) {
      throw new ForbiddenException('Only the provider can perform this action');
    }

    const updateData: Record<string, unknown> = { status: status as any };

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        gig: { include: { provider: { include: { profile: true } } } },
        client: { include: { profile: true } },
      },
    });

    await this.notifQueue.add('booking-status-changed', {
      bookingId: updated.id,
      status,
    });

    return updated;
  }

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isProvider = booking.gig.providerId === userId;
    const isClient = booking.clientId === userId;
    if (!isProvider && !isClient) throw new ForbiddenException();

    if (!['pending', 'accepted'].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel a booking that is already ' + booking.status);
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancelReason: reason || null,
        cancelledBy: userId,
        cancelledAt: new Date(),
      },
      include: {
        gig: { include: { provider: { include: { profile: true } } } },
        client: { include: { profile: true } },
      },
    });

    await this.notifQueue.add('booking-status-changed', {
      bookingId: updated.id,
      status: 'cancelled',
    });

    return updated;
  }

  async findForUser(userId: string, page: number, perPage: number) {
    const where = {
      OR: [
        { clientId: userId },
        { gig: { providerId: userId } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          gig: {
            include: {
              provider: { include: { profile: true } },
              category: true,
            },
          },
          client: { include: { profile: true } },
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}
