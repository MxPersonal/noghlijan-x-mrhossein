"use client";

import { useState } from "react";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
};

export function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (product.stock <= 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {product.stock <= 0
          ? "ناموجود"
          : added
            ? "به سبد اضافه شد"
            : "افزودن به سبد"}
      </button>
      <span className="text-sm text-ink-soft">{formatPrice(product.price)}</span>
    </div>
  );
}
