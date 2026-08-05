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
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl italic text-ink">Your Bag</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-stone">
          Your bag is empty.{" "}
          <Link href="/" className="text-gold underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-8 divide-y divide-hairline border-y border-hairline">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center gap-4 py-5"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden bg-parchment-deep">
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
                  <p className="font-serif text-base text-ink">{item.title}</p>
                  {item.metalType && (
                    <p className="text-xs uppercase tracking-widest text-stone">
                      {METAL_LABELS[item.metalType] ?? item.metalType}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-stone">
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
                  className="w-16 border border-hairline bg-parchment px-2 py-1 text-sm text-ink focus:border-gold focus:outline-none"
                />
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-xs uppercase tracking-widest text-stone hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="font-serif text-xl text-ink">
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
