"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCartStore } from "@/store/cartStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { currencyFormatter } from "@/lib/formatting";
import { createCheckout, type ShippingInput } from "@/lib/actions/checkout";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentStep({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clear);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    // return_url is required at confirmation time even when redirect is
    // "if_required" — Stripe can't know in advance whether the customer
    // will pick a redirect-based method (e.g. a wallet), so it validates
    // this up front. It's only actually navigated to if a redirect turns
    // out to be necessary; otherwise we handle success below ourselves.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    clearCart();
    router.push(`/checkout/success?order=${orderId}`);
  }

  return (
    <form onSubmit={handlePay} className="mt-6 space-y-4">
      <PaymentElement />
      {error && <ErrorMessage title="Payment failed" message={error} />}
      <Button type="submit" disabled={!stripe || isSubmitting} className="w-full">
        {isSubmitting ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

export default function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  async function handleShippingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const shipping: ShippingInput = {
      name: String(formData.get("name") ?? ""),
      addressLine1: String(formData.get("address-line1") ?? ""),
      addressLine2: String(formData.get("address-line2") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      postalCode: String(formData.get("postal-code") ?? ""),
      country: String(formData.get("country") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    };

    const lines = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    const result = await createCheckout(lines, shipping);

    if ("error" in result) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setClientSecret(result.clientSecret);
    setOrderId(result.orderId);
    setTotalAmount(result.totalAmount);
    setIsSubmitting(false);
  }

  if (items.length === 0 && !clientSecret) {
    return <p className="mt-4 text-sm text-stone">Your cart is empty.</p>;
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="mt-4">
        <ErrorMessage
          title="Payments not configured"
          message="Stripe keys haven't been set up for this environment yet."
        />
      </div>
    );
  }

  return (
    <div>
      <p className="mt-2 text-sm text-stone">
        Total: {currencyFormatter.format(clientSecret ? totalAmount : cartTotal)}
      </p>

      {!clientSecret ? (
        <form onSubmit={handleShippingSubmit} className="mt-6 space-y-4">
          <Input label="Full Name" type="text" id="name" required />
          <Input label="Address Line 1" type="text" id="address-line1" required />
          <Input label="Address Line 2" type="text" id="address-line2" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" type="text" id="city" required />
            <Input label="State / Province" type="text" id="state" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Postal Code" type="text" id="postal-code" />
            <Input label="Country" type="text" id="country" required />
          </div>
          <Input label="Phone" type="tel" id="phone" />

          {error && <ErrorMessage title="Could not start checkout" message={error} />}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Preparing payment..." : "Continue to Payment"}
          </Button>
        </form>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentStep orderId={orderId!} />
        </Elements>
      )}
    </div>
  );
}
