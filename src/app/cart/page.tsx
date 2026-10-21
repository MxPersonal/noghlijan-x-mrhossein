"use client";

import Image from "next/image";
import Link from "next/link";
import { cartItemKey, useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-4xl text-ink">سبد خرید</h1>
        <p className="mt-4 text-ink-soft">سبد خرید شما خالی است.</p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white hover:bg-teal-deep"
        >
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-ink">سبد خرید</h1>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li
            key={cartItemKey(item)}
            className="glass-surface flex gap-4 rounded-2xl p-4"
          >
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-mint">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                unoptimized={/^https?:\/\//i.test(item.imageUrl)}
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/shop/${item.slug}`}
                  className="font-medium text-ink hover:text-teal"
                >
                  {item.name}
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-xs text-peach hover:underline"
                >
                  حذف
                </button>
              </div>
              {item.variantLabel && <p className="text-xs text-teal-deep">مدل انتخابی: {item.variantLabel}</p>}
              <p className="text-sm text-ink-soft">{formatPrice(item.price)}</p>
              <div className="mt-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1, item.variantId)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-deep text-ink"
                >
                  −
                </button>
                <span className="min-w-6 text-center">
                  {item.quantity.toLocaleString("fa-IR")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1, item.variantId)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-deep text-ink"
                >
                  +
                </button>
                <span className="mr-auto text-sm text-teal-deep">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="glass-surface mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <p className="text-sm text-ink-soft">جمع کل</p>
          <p className="text-xl font-medium text-teal-deep">
            {formatPrice(total)}
          </p>
        </div>
        <Link
          href="/checkout"
          className="rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white hover:bg-teal-deep"
        >
          ادامه خرید
        </Link>
      </div>
    </div>
  );
}
