"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import Button from "@/components/ui/Button";
import { currencyFormatter } from "@/lib/formatting";

type Variant = {
  id: string;
  metal_type: string;
  swatch_hex: string;
  price_delta: number;
  stock: number;
  image_url: string | null;
};

const METAL_LABELS: Record<string, string> = {
  white_gold: "White Gold",
  yellow_gold: "Yellow Gold",
  rose_gold: "Rose Gold",
  silver: "Silver",
};

export default function ProductPurchasePanel({
  product,
  vendor,
  variants,
}: {
  product: {
    id: string;
    title: string;
    description: string | null;
    base_price: number;
    stock: number;
    primary_image_url: string | null;
  };
  vendor: { business_name: string; slug: string } | null;
  variants: Variant[];
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const price = product.base_price + (selectedVariant?.price_delta ?? 0);
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

  // Falls back to the product's primary photo whenever the selected variant
  // doesn't have its own image — most demo/seed data won't, since sourcing
  // a distinct real photo per metal color isn't realistic without actual
  // product photography.
  const displayedImage = useMemo(
    () => selectedVariant?.image_url || product.primary_image_url,
    [selectedVariant, product.primary_image_url]
  );

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        title: product.title,
        metalType: selectedVariant?.metal_type ?? null,
        unitPrice: price,
        imageUrl: displayedImage,
      },
      quantity
    );
    setJustAdded(true);
  }

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div className="aspect-square overflow-hidden bg-parchment-deep">
        {displayedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayedImage}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-stone">
            No image
          </div>
        )}
      </div>

      <div>
        <h1 className="font-serif text-3xl italic text-ink">{product.title}</h1>
        {vendor && (
          <Link
            href={`/vendors/${vendor.slug}`}
            className="mt-2 inline-block text-xs uppercase tracking-widest text-stone hover:text-gold"
          >
            Sold by {vendor.business_name}
          </Link>
        )}

        <p className="mt-6 text-lg text-ink">{currencyFormatter.format(price)}</p>

        {product.description && (
          <p className="mt-5 max-w-md text-sm leading-relaxed text-stone">
            {product.description}
          </p>
        )}

        {variants.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-stone">
              Metal: {selectedVariant ? METAL_LABELS[selectedVariant.metal_type] : ""}
            </p>
            <div className="flex gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setJustAdded(false);
                  }}
                  title={METAL_LABELS[v.metal_type] ?? v.metal_type}
                  className={`h-9 w-9 rounded-full border-2 transition-all ${
                    selectedVariantId === v.id
                      ? "border-gold scale-110"
                      : "border-hairline"
                  }`}
                  style={{ backgroundColor: v.swatch_hex }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-stone">
            Qty
            <input
              type="number"
              min={1}
              max={Math.max(availableStock, 1)}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="ml-2 w-16 border border-hairline bg-parchment px-2 py-1 text-ink focus:border-gold focus:outline-none"
            />
          </label>
          <span className="text-xs text-stone">
            {availableStock > 0 ? `${availableStock} in stock` : "Out of stock"}
          </span>
        </div>

        <div className="mt-8">
          <Button onClick={handleAddToCart} disabled={availableStock <= 0}>
            Add to Bag
          </Button>
        </div>

        {justAdded && (
          <p className="mt-4 text-sm text-stone">
            Added to bag.{" "}
            <Link href="/cart" className="text-gold underline">
              View bag
            </Link>
            {" · "}
            <Link href="/" className="text-gold underline">
              Continue shopping
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
