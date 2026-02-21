import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { type: string; title: string; body: string; link?: string }) {
    return this.prisma.notification.create({
      data: { userId, ...data },
    });
  }

  async list(userId: string, page = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      unread,
      meta: { total, page, totalPages: Math.ceil(total / take) },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Helper to create booking-related notifications
  async notifyBookingStatus(bookingId: string, status: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { gig: { include: { provider: true } }, client: { include: { profile: true } } },
    });
    if (!booking) return;

    const statusLabels: Record<string, string> = {
      pending: 'Nouvelle réservation',
      accepted: 'Réservation acceptée',
      in_progress: 'Service en cours',
      completed: 'Service terminé',
      cancelled: 'Réservation annulée',
    };

    const title = statusLabels[status] || 'Mise à jour réservation';

    if (status === 'pending') {
      // Notify provider
      await this.create(booking.gig.providerId, {
        type: 'booking',
        title,
        body: `${booking.client.profile?.name || 'Un client'} a réservé "${booking.gig.title}"`,
        link: `/dashboard/bookings`,
      });
    } else {
      // Notify client
      await this.create(booking.clientId, {
        type: 'booking',
        title,
        body: `Votre réservation pour "${booking.gig.title}" est maintenant: ${title.toLowerCase()}`,
        link: `/dashboard/my-bookings`,
      });
    }
  }

  async notifyNewMessage(conversationId: string, senderId: string, preview: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: { include: { profile: true } }, provider: { include: { profile: true } } },
    });
    if (!conversation) return;

    const recipientId = conversation.clientId === senderId ? conversation.providerId : conversation.clientId;
    const senderProfile = conversation.clientId === senderId ? conversation.client.profile : conversation.provider.profile;

    await this.create(recipientId, {
      type: 'message',
      title: 'Nouveau message',
      body: `${senderProfile?.name || 'Quelqu\'un'}: ${preview.slice(0, 100)}`,
      link: `/dashboard/messages/${conversationId}`,
    });
  }
}
