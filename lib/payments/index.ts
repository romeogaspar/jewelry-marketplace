import type { PaymentProvider } from "./provider";
import { stripeProvider } from "./stripe";

// Keyed off PAYMENT_PROVIDER so a future PayTabs/Telr adapter is a new file
// plus one line here — call sites only ever depend on the PaymentProvider
// interface, never import a provider SDK directly.
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "stripe";

  switch (provider) {
    case "stripe":
      return stripeProvider;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
  }
}
