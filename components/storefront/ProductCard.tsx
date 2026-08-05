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
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden bg-parchment-deep">
        {product.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primary_image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-stone">
            No image
          </div>
        )}
      </div>
      <div className="mt-3 text-center">
        <p className="font-serif text-base text-ink">{product.title}</p>
        <p className="mt-1 text-xs uppercase tracking-widest text-stone">
          {currencyFormatter.format(product.base_price)}
        </p>
      </div>
    </Link>
  );
}
