export interface PaymentInitResult {
  /** URL to redirect the client to for payment */
  paymentUrl: string;
  /** External order reference from the payment gateway */
  orderId: string;
}

export interface PaymentCallbackData {
  orderId: string;
  success: boolean;
  amount: number;
  rawData: Record<string, string>;
}

export interface PaymentProvider {
  /**
   * Initiate a payment session.
   * Returns a URL to redirect the user to and a gateway order ID.
   */
  initiate(params: {
    amount: number;
    currency: string;
    bookingId: string;
    description: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<PaymentInitResult>;

  /**
   * Parse and verify a callback/webhook from the payment gateway.
   * Returns structured data or throws if signature is invalid.
   */
  parseCallback(body: Record<string, string>): PaymentCallbackData;

  /**
   * Request a refund for a previously completed charge.
   */
  refund(orderId: string, amount: number): Promise<{ success: boolean; refundId?: string }>;
}
