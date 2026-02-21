import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { MoroccanSmsProvider } from '../common/sms.provider';
import { PushService } from '../common/push.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private sms: MoroccanSmsProvider,
    private push: PushService,
  ) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing notification: "${job.name}" — ${JSON.stringify(job.data)}`);

    switch (job.name) {
      case 'booking-created':
        await this.handleBookingCreated(job.data);
        break;
      case 'booking-status-changed':
        await this.handleBookingStatusChanged(job.data);
        break;
      case 'payment-received':
        await this.handlePaymentReceived(job.data);
        break;
      case 'payment-refunded':
        await this.handlePaymentRefunded(job.data);
        break;
      case 'dispute-opened':
        await this.handleDisputeOpened(job.data);
        break;
      case 'dispute-resolved':
        await this.handleDisputeResolved(job.data);
        break;
      default:
        this.logger.warn(`Unknown notification type: ${job.name}`);
    }
  }

  private async handleBookingCreated(data: { bookingId: string; providerId: string; clientId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        gig: true,
        client: { include: { profile: true } },
      },
    });
    if (!booking) return;

    const provider = await this.prisma.user.findUnique({
      where: { id: data.providerId },
      include: { profile: true },
    });
    if (!provider) return;

    const clientName = booking.client?.profile?.name || 'Client';
    const date = booking.scheduledAt.toLocaleDateString('fr-MA');

    // Create in-app notification
    await this.prisma.notification.create({
      data: {
        userId: data.providerId,
        type: 'booking_created',
        title: 'Nouvelle reservation',
        body: `${clientName} a reserve ${booking.gig.title} pour le ${date}`,
        link: '/dashboard/bookings',
      },
    });

    // Email
    if (provider.email) {
      const tmpl = this.email.bookingCreated(clientName, booking.gig.title, date);
      await this.email.send(provider.email, tmpl.subject, tmpl.html);
    }

    // SMS
    if (provider.phone) {
      await this.sms.send(provider.phone, `Gigs.ma: Nouvelle reservation de ${clientName} pour ${booking.gig.title}. Connectez-vous pour accepter.`);
    }

    // Push
    await this.push.sendToUser(data.providerId, 'Nouvelle reservation', `${clientName} a reserve ${booking.gig.title}`, '/dashboard/bookings');
  }

  private async handleBookingStatusChanged(data: { bookingId: string; status: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        gig: { include: { provider: { include: { profile: true } } } },
        client: { include: { profile: true } },
      },
    });
    if (!booking) return;

    // Notify both parties
    const notifyUsers = [
      { id: booking.clientId, email: booking.client?.email },
      { id: booking.gig.providerId, email: booking.gig.provider?.email },
    ];

    for (const u of notifyUsers) {
      await this.prisma.notification.create({
        data: {
          userId: u.id,
          type: 'booking_status',
          title: 'Mise a jour reservation',
          body: `Reservation pour ${booking.gig.title}: ${data.status}`,
          link: '/dashboard/bookings',
        },
      });

      if (u.email) {
        const tmpl = this.email.bookingStatusChanged(data.status, booking.gig.title);
        await this.email.send(u.email, tmpl.subject, tmpl.html);
      }

      await this.push.sendToUser(u.id, 'Mise a jour reservation', `${booking.gig.title}: ${data.status}`, '/dashboard/bookings');
    }
  }

  private async handlePaymentReceived(data: { bookingId: string; amount: number }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { gig: true },
    });
    if (!booking) return;

    await this.prisma.notification.create({
      data: {
        userId: booking.gig.providerId,
        type: 'payment_received',
        title: 'Paiement recu',
        body: `Paiement de ${data.amount} MAD recu pour ${booking.gig.title}`,
        link: '/dashboard/wallet',
      },
    });

    await this.push.sendToUser(booking.gig.providerId, 'Paiement recu', `${data.amount} MAD pour ${booking.gig.title}`, '/dashboard/wallet');
  }

  private async handlePaymentRefunded(data: { bookingId: string; amount: number; userId: string }) {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: 'payment_refunded',
        title: 'Remboursement effectue',
        body: `Remboursement de ${data.amount} MAD effectue`,
        link: '/dashboard/bookings',
      },
    });

    await this.push.sendToUser(data.userId, 'Remboursement', `${data.amount} MAD rembourse`, '/dashboard/bookings');
  }

  private async handleDisputeOpened(data: { disputeId: string; bookingId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { gig: true },
    });
    if (!booking) return;

    // Notify both parties and admins
    const targets = [booking.clientId, booking.gig.providerId];
    for (const userId of targets) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'dispute_opened',
          title: 'Litige ouvert',
          body: `Un litige a ete ouvert pour ${booking.gig.title}`,
          link: '/dashboard/disputes',
        },
      });
      await this.push.sendToUser(userId, 'Litige ouvert', `Litige pour ${booking.gig.title}`, '/dashboard/disputes');
    }
  }

  private async handleDisputeResolved(data: { disputeId: string; status: string; bookingId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { gig: true },
    });
    if (!booking) return;

    const targets = [booking.clientId, booking.gig.providerId];
    for (const userId of targets) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'dispute_resolved',
          title: 'Litige resolu',
          body: `Le litige pour ${booking.gig.title} a ete resolu`,
          link: '/dashboard/disputes',
        },
      });
      await this.push.sendToUser(userId, 'Litige resolu', `Litige pour ${booking.gig.title} resolu`, '/dashboard/disputes');
    }
  }
}
