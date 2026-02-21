import { Injectable, Logger } from '@nestjs/common';

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/**
 * SMS provider for Morocco using a local gateway (cmt.ma, smsbox.ma, or similar).
 * Abstracted behind an interface so the provider can be swapped.
 *
 * Required env vars: SMS_API_URL, SMS_API_KEY, SMS_SENDER_ID
 */
@Injectable()
export class MoroccanSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MoroccanSmsProvider.name);

  private readonly apiUrl = process.env.SMS_API_URL || '';
  private readonly apiKey = process.env.SMS_API_KEY || '';
  private readonly senderId = process.env.SMS_SENDER_ID || 'Gigs.ma';

  async send(to: string, message: string): Promise<void> {
    if (!this.apiUrl || !this.apiKey) {
      this.logger.warn(`SMS skipped (no provider configured): to=${to} msg="${message.substring(0, 50)}..."`);
      return;
    }

    try {
      // Generic HTTP SMS gateway API call
      // Most Moroccan SMS providers (cmt.ma, smsbox.ma, infobip) use similar REST APIs
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to,
          from: this.senderId,
          text: message,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`SMS failed: to=${to} status=${res.status} body=${body}`);
        return;
      }

      this.logger.log(`SMS sent: to=${to}`);
    } catch (err) {
      this.logger.error(`SMS error: to=${to}`, (err as Error).stack);
    }
  }
}
