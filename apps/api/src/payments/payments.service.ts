import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CmiProvider } from './cmi.provider';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private cmi: CmiProvider,
    @InjectQueue('notifications') private notifQueue: Queue,
  ) {}

  /**
   * Initiate a payment for a booking. Returns the CMI payment URL.
   */
  async initiatePayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: { include: { provider: true } }, client: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== userId) {
      throw new BadRequestException('Only the client can pay for this booking');
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking is not in a payable state');
    }

    // Check for existing pending transaction
    const existingTx = await this.prisma.transaction.findFirst({
      where: { bookingId, type: 'charge', status: 'pending' },
    });
    if (existingTx) {
      throw new BadRequestException('A payment is already pending for this booking');
    }

    const baseUrl = process.env.WEB_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || 'http://localhost:4000';

    const result = await this.cmi.initiate({
      amount: booking.totalPrice,
      currency: 'MAD',
      bookingId: booking.id,
      description: `Gigs.ma - ${booking.gig.title}`,
      returnUrl: `${baseUrl}/dashboard/bookings?payment=${bookingId}`,
      callbackUrl: `${apiUrl}/api/payments/callback`,
    });

    // Create pending transaction
    await this.prisma.transaction.create({
      data: {
        bookingId,
        userId,
        type: 'charge',
        status: 'pending',
        amount: booking.totalPrice,
        platformFee: booking.totalPrice * (PLATFORM_FEE_PERCENT / 100),
        cmiOrderId: result.orderId,
      },
    });

    return { paymentUrl: result.paymentUrl, orderId: result.orderId };
  }

  /**
   * Handle CMI callback (server-to-server). Called by CMI after payment attempt.
   */
  async handleCallback(body: Record<string, string>) {
    const data = this.cmi.parseCallback(body);

    const tx = await this.prisma.transaction.findFirst({
      where: { cmiOrderId: data.orderId },
      include: { booking: { include: { gig: true } } },
    });

    if (!tx) {
      this.logger.warn(`CMI callback: no transaction found for orderId=${data.orderId}`);
      return { status: 'ignored' };
    }

    if (tx.status !== 'pending') {
      this.logger.warn(`CMI callback: transaction ${tx.id} already processed (status=${tx.status})`);
      return { status: 'already_processed' };
    }

    // Validate callback amount matches stored transaction
    if (data.amount && Math.abs(data.amount - tx.amount) > 0.01) {
      this.logger.warn(`CMI callback: amount mismatch for tx=${tx.id} — expected=${tx.amount} received=${data.amount}`);
      return { status: 'amount_mismatch' };
    }

    if (data.success) {
      // Payment successful — update transaction, booking, and provider wallet
      await this.prisma.$transaction(async (prisma) => {
        // Mark transaction as completed
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'completed',
            metadata: data.rawData as any,
          },
        });

        // Update booking status to accepted (paid)
        await prisma.booking.update({
          where: { id: tx.bookingId! },
          data: { status: 'accepted' },
        });

        // Add to provider's pending balance (escrow)
        const providerAmount = tx.amount - (tx.platformFee || 0);
        await prisma.wallet.upsert({
          where: { userId: tx.booking!.gig.providerId },
          create: {
            userId: tx.booking!.gig.providerId,
            pendingBalance: providerAmount,
          },
          update: {
            pendingBalance: { increment: providerAmount },
          },
        });
      });

      // Queue notification
      await this.notifQueue.add('payment-received', {
        bookingId: tx.bookingId,
        amount: tx.amount,
      });

      this.logger.log(`Payment completed: tx=${tx.id} booking=${tx.bookingId} amount=${tx.amount}`);
      return { status: 'success' };
    } else {
      // Payment failed
      await this.prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'failed',
          metadata: data.rawData as any,
        },
      });

      this.logger.warn(`Payment failed: tx=${tx.id} booking=${tx.bookingId}`);
      return { status: 'failed' };
    }
  }

  /**
   * Release escrow: move funds from pendingBalance to balance when booking completes.
   * Called when booking status transitions to 'completed'.
   */
  async releaseEscrow(bookingId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { bookingId, type: 'charge', status: 'completed' },
      include: { booking: { include: { gig: true } } },
    });

    if (!tx || !tx.booking) return;

    const providerAmount = tx.amount - (tx.platformFee || 0);

    await this.prisma.wallet.update({
      where: { userId: tx.booking.gig.providerId },
      data: {
        pendingBalance: { decrement: providerAmount },
        balance: { increment: providerAmount },
        totalEarned: { increment: providerAmount },
      },
    });

    this.logger.log(`Escrow released: booking=${bookingId} provider=${tx.booking.gig.providerId} amount=${providerAmount}`);
  }

  /**
   * Refund a booking's payment to the client.
   */
  async refund(bookingId: string, adminId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { bookingId, type: 'charge', status: 'completed' },
      include: { booking: { include: { gig: true } } },
    });

    if (!tx) throw new NotFoundException('No completed payment found for this booking');

    // Check if already refunded
    const existingRefund = await this.prisma.transaction.findFirst({
      where: { bookingId, type: 'refund', status: { not: 'failed' } },
    });
    if (existingRefund) throw new BadRequestException('Booking already refunded');

    const cmiResult = await this.cmi.refund(tx.cmiOrderId || '', tx.amount);

    // CMI refunds require manual processing — mark as pending, do NOT adjust wallet yet
    await this.prisma.transaction.create({
      data: {
        bookingId,
        userId: tx.userId,
        type: 'refund',
        status: 'pending',
        amount: tx.amount,
        cmiOrderId: cmiResult.refundId,
        metadata: { refundedBy: adminId, manualProcessingRequired: true },
      },
    });

    this.logger.log(`Refund marked as pending manual processing: booking=${bookingId} amount=${tx.amount} by admin=${adminId}`);
    return { success: false, status: 'refund_pending', amount: tx.amount, message: 'Refund requires manual processing via CMI portal' };
  }

  /**
   * Get wallet info for a user.
   */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    return wallet || { balance: 0, pendingBalance: 0, totalEarned: 0 };
  }

  /**
   * Get transaction history for a user.
   */
  async getTransactions(userId: string, page: number, perPage: number) {
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          booking: {
            include: {
              gig: { select: { title: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  /**
   * Admin: list all payouts.
   */
  async listPayouts(page: number, perPage: number, status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          provider: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  /**
   * Admin: create a payout request for a provider.
   */
  async createPayout(providerId: string, amount: number, adminId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: providerId },
    });

    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const payout = await this.prisma.$transaction(async (prisma) => {
      // Deduct from balance
      await prisma.wallet.update({
        where: { userId: providerId },
        data: { balance: { decrement: amount } },
      });

      // Create payout record
      return prisma.payout.create({
        data: {
          providerId,
          amount,
          status: 'processing',
          processedBy: adminId,
        },
        include: { provider: { include: { profile: true } } },
      });
    });

    // Create a transaction record for the payout
    await this.prisma.transaction.create({
      data: {
        userId: providerId,
        type: 'payout',
        status: 'completed',
        amount,
        metadata: { payoutId: payout.id },
      },
    });

    return payout;
  }

  /**
   * Admin: mark a payout as completed.
   */
  async completePayout(payoutId: string, adminId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status === 'completed') {
      throw new BadRequestException('Payout already completed');
    }

    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        processedBy: adminId,
        processedAt: new Date(),
      },
      include: { provider: { include: { profile: true } } },
    });
  }

  /**
   * Admin: get aggregate stats for payout dashboard.
   */
  async getPayoutStats() {
    const [pendingPayouts, totalPaidOut, totalPending] = await Promise.all([
      this.prisma.payout.count({ where: { status: { in: ['pending', 'processing'] } } }),
      this.prisma.payout.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.wallet.aggregate({
        _sum: { balance: true, pendingBalance: true },
      }),
    ]);

    return {
      pendingPayouts,
      totalPaidOut: totalPaidOut._sum.amount || 0,
      totalAvailableBalance: totalPending._sum.balance || 0,
      totalEscrowBalance: totalPending._sum.pendingBalance || 0,
    };
  }
}
