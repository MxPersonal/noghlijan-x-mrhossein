"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PENDING_ADD_KEY } from "@/components/customer/PendingCartRestore";
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
    variantId?: string;
    variantLabel?: string;
  };
};

export function AddToCartButton({ product }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    if (product.stock <= 0 || checking) return;
    setChecking(true);
    const selection = {
      productId: product.id,
      variantId: product.variantId,
      variantLabel: product.variantLabel,
      name: product.name,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
    };
    try {
      const response = await fetch("/api/customer/me", { cache: "no-store" });
      if (response.status === 401) {
        sessionStorage.setItem(PENDING_ADD_KEY, JSON.stringify({ item: selection, quantity: 1, createdAt: Date.now() }));
        router.push("/login?next=" + encodeURIComponent("/shop/" + product.slug));
        return;
      }
      if (!response.ok) throw new Error("در حال حاضر امکان بررسی حساب کاربری وجود ندارد.");
      addItem(selection);
    } catch (error) {
      alert(error instanceof Error ? error.message : "اتصال برقرار نیست؛ دوباره تلاش کنید.");
      return;
    } finally {
      setChecking(false);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleAdd}
        disabled={product.stock <= 0 || checking}
        className="rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white transition hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {product.stock <= 0
          ? "ناموجود"
          : checking
            ? "در حال بررسی..." 
          : added
            ? "به سبد اضافه شد"
            : "افزودن به سبد"}
      </button>
      <span className="text-sm text-ink-soft">{formatPrice(product.price)}</span>
    </div>
  );
}
