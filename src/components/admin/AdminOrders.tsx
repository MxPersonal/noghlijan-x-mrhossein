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
  paymentProvider: string | null;
  paymentReviewReason: string | null;
  postalCode: string | null;
  recipientIsOther: boolean;
  recipientName: string | null;
  recipientPhone: string | null;
  createdAt: string;
  items: { quantity: number; unitPrice: number; variantLabel: string | null; product: { name: string } }[];
};

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "در انتظار پرداخت", className: "pending" },
  PAID: { label: "پرداخت‌شده", className: "paid" },
  FAILED: { label: "ناموفق", className: "failed" },
  SHIPPED: { label: "ارسال‌شده", className: "shipped" },
};

const filters = [
  { value: "all", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "SHIPPED", label: "ارسال‌شده" },
  { value: "FAILED", label: "ناموفق" },
] as const;

export function AdminOrders({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const normalized = search.trim().toLocaleLowerCase();
  const visible = orders.filter(order =>
    (filter === "all" || order.status === filter) &&
    (!normalized || [order.customerName, order.phone, order.id, order.refId || ""]
      .some(value => value.toLocaleLowerCase().includes(normalized)))
  );

  async function setStatus(id: string, status: string) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json().catch(() => ({})) as { status?: string; error?: string };
      if (!response.ok) throw Error(data.error || "تغییر وضعیت سفارش ناموفق بود");
      setOrders(current => current.map(order => order.id === id
        ? { ...order, status: data.status ?? status }
        : order));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ارتباط با سرور برقرار نشد");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-orders" id="admin-order-list" aria-labelledby="admin-orders-title">
      <div className="admin-orders-toolbar">
        <div>
          <p className="admin-panel-overline">01 / مدیریت سفارش‌ها</p>
          <h2 id="admin-orders-title">سفارش‌ها <span aria-hidden="true">✿</span></h2>
          <p>جست‌وجو، بررسی جزئیات و تغییر وضعیت ارسال در یک صفحه.</p>
        </div>
        <label className="admin-catalog-search admin-order-search">
          <span aria-hidden="true">⌕</span>
          <span className="sr-only">جست‌وجوی سفارش</span>
          <input type="search" value={search} onChange={event => setSearch(event.target.value)}
            placeholder="نام مشتری، شماره یا کد سفارش..." />
        </label>
      </div>
      <div className="admin-order-filters" role="group" aria-label="فیلتر وضعیت سفارش">
        {filters.map(item => (
          <button key={item.value} type="button" aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={"admin-order-filter" + (filter === item.value ? " is-active" : "")}>
            {item.label}
            <span>{(item.value === "all" ? orders.length : orders.filter(order => order.status === item.value).length).toLocaleString("fa-IR")}</span>
          </button>
        ))}
      </div>
      {error && <p className="admin-order-error" role="alert">{error}</p>}
      {!visible.length ? (
        <div className="admin-orders-empty">
          <span aria-hidden="true">✿</span>
          <h3>{orders.length ? "سفارشی با این جست‌وجو پیدا نشد" : "هنوز سفارشی ثبت نشده"}</h3>
          <p>{orders.length ? "فیلتر یا عبارت جست‌وجو را تغییر بده." : "سفارش‌های جدید اینجا نمایش داده می‌شوند."}</p>
          {orders.length > 0 && <button type="button" onClick={() => { setFilter("all"); setSearch(""); }}>نمایش همهٔ سفارش‌ها</button>}
        </div>
      ) : (
        <div className="admin-order-list">
          {visible.map(order => {
            const status = STATUS[order.status] ?? { label: order.status, className: "pending" };
            return (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-card-top">
                  <div className="admin-order-avatar" aria-hidden="true">✿</div>
                  <div className="admin-order-person">
                    <h3>{order.customerName}</h3>
                    <p>{formatDate(order.createdAt)} · <span dir="ltr">{order.phone}</span></p>
                  </div>
                  <span className={"admin-order-status " + status.className}>{status.label}</span>
                </div>
                <div className="admin-order-card-details">
                  <div>
                    <span className="admin-order-small-label">کد سفارش</span>
                    <p className="admin-order-code" dir="ltr">{order.id.slice(-10).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="admin-order-small-label">روش پرداخت</span>
                    <p>{({ zarinpal: "زرین‌پال", aqayepardakht: "آقای پرداخت",
                      balepay: "بله‌پی", nowpayments: "رمزارز" } as Record<string, string>)[order.paymentProvider ?? ""] ?? "قدیمی / نامشخص"}</p>
                    {order.paymentReviewReason && <p className="admin-order-payment-alert">{order.paymentReviewReason}</p>}
                  </div>
                  <div>
                    <span className="admin-order-small-label">مبلغ سفارش</span>
                    <p className="admin-order-total">{formatPrice(order.total)}</p>
                  </div>
                  <div className="admin-order-address">
                    <span className="admin-order-small-label">آدرس ارسال</span>
                    <p>{order.address}</p>
                    {order.postalCode && <p>کد پستی: <span dir="ltr">{order.postalCode}</span></p>}
                    {order.recipientIsOther && <p className="mt-1 font-semibold text-ink">
                      تحویل‌گیرنده: {order.recipientName} · <span dir="ltr">{order.recipientPhone}</span>
                    </p>}
                  </div>
                </div>
                <div className="admin-order-items">
                  <h4>اقلام سفارش <span>{order.items.length.toLocaleString("fa-IR")}</span></h4>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        <span className="admin-order-item-name">
                          {item.product.name}
                          {item.variantLabel && <small>{item.variantLabel}</small>}
                        </span>
                        <span className="admin-order-item-amount">
                          {item.quantity.toLocaleString("fa-IR")} × {formatPrice(item.unitPrice)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="admin-order-card-footer">
                  <span>{order.refId ? "کد پیگیری: " + order.refId : "نقلی‌جان · فروشگاه پوشاک کودک"}</span>
                  {order.status === "PAID" &&
                    <button type="button" disabled={busy === order.id}
                      onClick={() => void setStatus(order.id, "SHIPPED")}
                      className="admin-order-ship">
                      {busy === order.id ? "در حال ثبت..." : "ثبت به‌عنوان ارسال‌شده"} <span aria-hidden="true">↗</span>
                    </button>
                  }
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
