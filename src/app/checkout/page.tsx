"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-4xl text-ink">تسویه حساب</h1>
        <p className="mt-4 text-ink-soft">سبد خرید خالی است.</p>
        <Link href="/shop" className="mt-6 inline-block text-teal">
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          address: form.get("address"),
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        paymentUrl?: string;
        orderId?: string;
        demo?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? "خطا در ثبت سفارش");
        setLoading(false);
        return;
      }

      clearCart();

      if (data.demo && data.orderId) {
        router.push(`/payment/verify?demo=1&orderId=${data.orderId}`);
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setError("پاسخ نامعتبر از سرور");
      setLoading(false);
    } catch {
      setError("خطای شبکه. دوباره تلاش کنید.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl text-ink">تسویه حساب</h1>
      <p className="mt-2 text-ink-soft">
        مبلغ قابل پرداخت:{" "}
        <span className="font-medium text-teal-deep">{formatPrice(total)}</span>
      </p>

      <form onSubmit={onSubmit} className="glass-surface mt-8 space-y-4 rounded-3xl p-5 sm:p-7">
        <Field label="نام و نام خانوادگی" name="customerName" required />
        <Field
          label="شماره موبایل"
          name="phone"
          type="tel"
          required
          placeholder="09xxxxxxxxx"
        />
        <div>
          <label htmlFor="address" className="mb-1.5 block text-sm text-ink-soft">
            آدرس ارسال
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={3}
            className="glass-input w-full rounded-xl px-4 py-3 text-ink outline-none ring-teal/30 focus:ring-2"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-peach/15 px-4 py-3 text-sm text-peach">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal py-3 text-sm font-medium text-white transition hover:bg-teal-deep disabled:opacity-60"
        >
          {loading ? "در حال ثبت..." : "پرداخت و ثبت سفارش"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm text-ink-soft">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="glass-input w-full rounded-xl px-4 py-3 text-ink outline-none ring-teal/30 focus:ring-2"
      />
    </div>
  );
}
