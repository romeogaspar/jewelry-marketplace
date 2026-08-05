"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

export default function CartLink() {
  const items = useCartStore((s) => s.items);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link href="/cart" className="hover:text-gold">
      Bag{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
