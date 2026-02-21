import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.warn(`Email skipped (no SMTP configured): to=${to} subject="${subject}"`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Gigs.ma <noreply@gigs.ma>',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: to=${to} subject="${subject}"`);
    } catch (err) {
      this.logger.error(`Email failed: to=${to} subject="${subject}"`, (err as Error).stack);
    }
  }

  // --- Email Templates ---

  bookingCreated(clientName: string, gigTitle: string, date: string) {
    return {
      subject: `Nouvelle reservation - ${gigTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#059669">Nouvelle reservation</h2>
          <p>Bonjour,</p>
          <p><strong>${clientName}</strong> a reserve votre service <strong>${gigTitle}</strong> pour le <strong>${date}</strong>.</p>
          <p>Connectez-vous a votre tableau de bord pour accepter ou refuser la reservation.</p>
          <a href="${process.env.WEB_URL || 'https://gigs.ma'}/dashboard/bookings" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Voir la reservation</a>
        </div>
      `,
    };
  }

  bookingStatusChanged(status: string, gigTitle: string) {
    const statusLabels: Record<string, string> = {
      accepted: 'acceptee', in_progress: 'en cours', completed: 'terminee',
      cancelled: 'annulee', disputed: 'en litige',
    };
    return {
      subject: `Reservation ${statusLabels[status] || status} - ${gigTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#059669">Mise a jour de reservation</h2>
          <p>Votre reservation pour <strong>${gigTitle}</strong> est maintenant <strong>${statusLabels[status] || status}</strong>.</p>
          <a href="${process.env.WEB_URL || 'https://gigs.ma'}/dashboard/bookings" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Voir les details</a>
        </div>
      `,
    };
  }

  newMessage(senderName: string) {
    return {
      subject: `Nouveau message de ${senderName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#059669">Nouveau message</h2>
          <p>Vous avez recu un nouveau message de <strong>${senderName}</strong>.</p>
          <a href="${process.env.WEB_URL || 'https://gigs.ma'}/dashboard/messages" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Lire le message</a>
        </div>
      `,
    };
  }
}
