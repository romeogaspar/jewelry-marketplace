import Link from "next/link";
import { currencyFormatter } from "@/lib/formatting";

type Product = {
  id: string;
  slug: string;
  title: string;
  base_price: number;
  primary_image_url: string | null;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-neutral-200"
    >
      <div className="aspect-square overflow-hidden bg-neutral-100">
        {product.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-neutral-900">{product.title}</p>
        <p className="text-sm text-neutral-500">
          {currencyFormatter.format(product.base_price)}
        </p>
      </div>
    </Link>
  );
}
