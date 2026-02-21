import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: {
        client: { include: { profile: true } },
        provider: { include: { profile: true } },
        booking: { include: { gig: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOrCreateConversation(clientId: string, providerId: string, bookingId?: string) {
    const existing = await this.prisma.conversation.findUnique({
      where: { clientId_providerId: { clientId, providerId } },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { clientId, providerId, bookingId },
    });
  }

  async getMessages(conversationId: string, userId: string, page = 1) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation non trouvée');
    if (conversation.clientId !== userId && conversation.providerId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    const take = 50;
    const skip = (page - 1) * take;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: { sender: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      data: messages.reverse(),
      meta: { total, page, totalPages: Math.ceil(total / take) },
      conversation,
    };
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation non trouvée');
    if (conversation.clientId !== senderId && conversation.providerId !== senderId) {
      throw new ForbiddenException('Accès refusé');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId, content },
        include: { sender: { include: { profile: true } } },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: {
        conversation: {
          OR: [{ clientId: userId }, { providerId: userId }],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  async startConversation(clientId: string, providerId: string, message: string, bookingId?: string) {
    const conversation = await this.getOrCreateConversation(clientId, providerId, bookingId);

    const msg = await this.prisma.message.create({
      data: { conversationId: conversation.id, senderId: clientId, content: message },
      include: { sender: { include: { profile: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return { conversation, message: msg };
  }
}
