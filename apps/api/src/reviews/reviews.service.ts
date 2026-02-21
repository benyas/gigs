import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReviewInput } from '@gigs/shared';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, data: CreateReviewInput) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { gig: true, review: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== clientId) throw new ForbiddenException();
    if (booking.status !== 'completed') {
      throw new BadRequestException('Can only review completed bookings');
    }
    if (booking.review) {
      throw new BadRequestException('Booking already has a review');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId: data.bookingId,
        clientId,
        providerId: booking.gig.providerId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        client: { include: { profile: true } },
      },
    });

    // Update provider's average rating
    const stats = await this.prisma.review.aggregate({
      where: { providerId: booking.gig.providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.profile.update({
      where: { userId: booking.gig.providerId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating,
      },
    });

    return review;
  }

  async reply(reviewId: string, providerId: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.providerId !== providerId) throw new ForbiddenException();
    if (review.providerReply) throw new BadRequestException('Already replied to this review');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        providerReply: reply,
        providerReplyAt: new Date(),
      },
      include: {
        client: { include: { profile: true } },
        booking: { include: { gig: true } },
      },
    });
  }

  async findForProvider(providerId: string, page: number, perPage: number) {
    const where = { providerId };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          client: { include: { profile: true } },
          booking: { include: { gig: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}
