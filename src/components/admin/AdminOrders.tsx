"use client";

import { useState } from "react";
import { formatDate, formatPrice } from "@/lib/format";

type Order = {
  id: string;
  status: string;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  refId: string | null;
  createdAt: string;
  items: {
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }[];
};

const statusLabel: Record<string, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
  SHIPPED: "ارسال‌شده",
};

export function AdminOrders({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)),
      );
    }
    setBusy(null);
  }

  if (orders.length === 0) {
    return <p className="text-ink-soft">هنوز سفارشی ثبت نشده است.</p>;
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li
          key={order.id}
          className="glass-surface rounded-2xl p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{order.customerName}</p>
              <p className="text-sm text-ink-soft">
                {order.phone} · {formatDate(order.createdAt)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{order.address}</p>
            </div>
            <div className="text-left">
              <p className="text-teal-deep">{formatPrice(order.total)}</p>
              <p className="text-xs text-ink-soft">
                {statusLabel[order.status] ?? order.status}
              </p>
              {order.refId ? (
                <p className="text-xs text-ink-soft">پیگیری: {order.refId}</p>
              ) : null}
            </div>
          </div>
          <ul className="mt-3 space-y-1 border-t border-ink/6 pt-3 text-sm text-ink-soft">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.product.name} × {item.quantity} —{" "}
                {formatPrice(item.unitPrice * item.quantity)}
              </li>
            ))}
          </ul>
          {order.status === "PAID" ? (
            <button
              type="button"
              disabled={busy === order.id}
              onClick={() => setStatus(order.id, "SHIPPED")}
              className="mt-3 rounded-lg bg-mint px-3 py-1.5 text-xs text-teal-deep hover:bg-teal hover:text-white disabled:opacity-50"
            >
              علامت‌گذاری به‌عنوان ارسال‌شده
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
