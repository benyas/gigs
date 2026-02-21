import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(private prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        'mailto:contact@gigs.ma',
        publicKey,
        privateKey,
      );
      this.enabled = true;
    } else {
      this.enabled = false;
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  async sendToUser(userId: string, title: string, body: string, link?: string) {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    const payload = JSON.stringify({ title, body, url: link || '/' });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err: any) {
        // If subscription is expired/invalid, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        this.logger.warn(`Push failed for subscription ${sub.id}: ${err.message}`);
      }
    }
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    // Upsert by endpoint to avoid duplicates
    const existing = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (existing) return existing;

    return this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  }
}
