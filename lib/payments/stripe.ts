import Stripe from "stripe";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  PaymentStatus,
} from "./provider";

function client() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  succeeded: "succeeded",
  requires_payment_method: "failed",
  canceled: "failed",
};

export const stripeProvider: PaymentProvider = {
  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const intent = await client().paymentIntents.create({
      amount: input.amountMinorUnits,
      currency: input.currency,
      metadata: input.metadata,
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      throw new Error("Stripe did not return a client secret.");
    }

    return { providerIntentId: intent.id, clientSecret: intent.client_secret };
  },

  async retrievePaymentStatus(providerIntentId: string): Promise<PaymentStatus> {
    const intent = await client().paymentIntents.retrieve(providerIntentId);
    return STATUS_MAP[intent.status] ?? "pending";
  },

  verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
    return client().webhooks.constructEvent(rawBody, signature, secret);
  },
};
