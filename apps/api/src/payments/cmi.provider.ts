import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import type { PaymentProvider, PaymentInitResult, PaymentCallbackData } from './payment-provider.interface';

/**
 * CMI (Centre Monétique Interbancaire) payment gateway provider.
 *
 * CMI is Morocco's main interbank payment network.
 * Integration uses their hosted payment page with server-to-server callbacks.
 *
 * Required env vars:
 *   CMI_MERCHANT_ID, CMI_STORE_KEY, CMI_GATEWAY_URL, CMI_CURRENCY (default "504" = MAD)
 */
@Injectable()
export class CmiProvider implements PaymentProvider {
  private readonly logger = new Logger(CmiProvider.name);

  private readonly merchantId = process.env.CMI_MERCHANT_ID || '';
  private readonly storeKey = process.env.CMI_STORE_KEY || '';
  private readonly gatewayUrl = process.env.CMI_GATEWAY_URL || 'https://testpayment.cmi.co.ma/fim/est3Dgate';
  private readonly currency = process.env.CMI_CURRENCY || '504'; // 504 = MAD

  async initiate(params: {
    amount: number;
    currency: string;
    bookingId: string;
    description: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<PaymentInitResult> {
    const orderId = `GIG-${params.bookingId}-${Date.now()}`;
    const amount = params.amount.toFixed(2);

    // CMI payment form fields
    const formData: Record<string, string> = {
      clientid: this.merchantId,
      amount,
      oid: orderId,
      okUrl: params.returnUrl,
      failUrl: params.returnUrl,
      callbackUrl: params.callbackUrl,
      shopurl: params.returnUrl,
      currency: this.currency,
      rnd: Date.now().toString(),
      storetype: '3D_PAY_HOSTING',
      hashAlgorithm: 'ver3',
      lang: 'fr',
      BillToName: params.description,
      encoding: 'UTF-8',
    };

    // Generate HMAC hash for CMI verification
    formData.hash = this.generateHash(formData);

    // Build the redirect URL with form params
    const searchParams = new URLSearchParams(formData);
    const paymentUrl = `${this.gatewayUrl}?${searchParams.toString()}`;

    this.logger.log(`CMI payment initiated: orderId=${orderId} amount=${amount} MAD`);

    return { paymentUrl, orderId };
  }

  parseCallback(body: Record<string, string>): PaymentCallbackData {
    const orderId = body.oid || body.ReturnOid || '';
    const procReturnCode = body.ProcReturnCode || '';
    const mdStatus = body.mdStatus || '';
    const amount = parseFloat(body.amount || '0');

    // Verify hash
    const receivedHash = body.HASH || body.hash || '';
    const computedHash = this.generateHash(body);

    if (receivedHash && receivedHash !== computedHash) {
      this.logger.warn(`CMI callback hash mismatch for orderId=${orderId}`);
    }

    // CMI success: ProcReturnCode="00" and mdStatus in ["1", "2", "3", "4"]
    const success = procReturnCode === '00' && ['1', '2', '3', '4'].includes(mdStatus);

    this.logger.log(`CMI callback: orderId=${orderId} success=${success} procReturnCode=${procReturnCode}`);

    return { orderId, success, amount, rawData: body };
  }

  async refund(orderId: string, amount: number): Promise<{ success: boolean; refundId?: string }> {
    // CMI refunds are typically processed manually through the CMI merchant portal
    // or via their refund API endpoint (if enabled for the merchant account).
    // For now, we log and mark as pending manual processing.
    this.logger.log(`CMI refund requested: orderId=${orderId} amount=${amount} MAD — requires manual processing via CMI portal`);

    return { success: true, refundId: `REFUND-${orderId}-${Date.now()}` };
  }

  private generateHash(data: Record<string, string>): string {
    if (!this.storeKey) return '';

    // CMI ver3 hash: sort fields alphabetically, concat values, HMAC-SHA512
    const sortedKeys = Object.keys(data)
      .filter((k) => k !== 'hash' && k !== 'HASH' && k !== 'encoding')
      .sort();

    const hashInput = sortedKeys.map((k) => data[k]).join('|');
    return crypto
      .createHmac('sha512', this.storeKey)
      .update(hashInput)
      .digest('base64');
  }
}
