"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

const METAL_LABELS: Record<string, string> = {
  white_gold: "White Gold",
  yellow_gold: "Yellow Gold",
  rose_gold: "Rose Gold",
  silver: "Silver",
};

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Your Cart</h1>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          Your cart is empty.{" "}
          <Link href="/" className="underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center gap-4 p-4"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                  {item.metalType && (
                    <p className="text-xs text-neutral-500">
                      {METAL_LABELS[item.metalType] ?? item.metalType}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500">
                    {currencyFormatter.format(item.unitPrice)}
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    setQuantity(item.productId, item.variantId, Number(e.target.value))
                  }
                  className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-lg font-medium text-neutral-900">
              Total: {currencyFormatter.format(total)}
            </p>
            <Link href="/checkout">
              <Button>Proceed to Checkout</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
