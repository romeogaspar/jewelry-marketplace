export interface PaymentIntentInput {
  amountMinorUnits: number; // e.g. cents for USD
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  providerIntentId: string;
  clientSecret: string;
}

export type PaymentStatus = "pending" | "succeeded" | "failed";

export interface PaymentProvider {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  retrievePaymentStatus(providerIntentId: string): Promise<PaymentStatus>;
  // Verifies a webhook payload and returns the parsed event, or throws if
  // the signature doesn't check out. Typed as unknown at this layer so
  // call sites stay provider-agnostic; the Stripe adapter narrows it.
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): unknown;
}
