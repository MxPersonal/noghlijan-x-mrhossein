"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

type BaleWebApp = {
  initData: string;
  ready: () => void;
  expand?: () => void;
  openInvoice: (params: string, cb?: (event: { status?: string }) => void) => void;
};

declare global {
  interface Window {
    Bale?: { WebApp?: BaleWebApp };
  }
}

type State = "loading" | "ready" | "opening" | "waiting" | "paid" | "error";

export function BalePaymentMiniapp() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<State>("loading");
  const [message, setMessage] = useState("در حال اتصال به مینی‌اپ بله…");
  const [invoice, setInvoice] = useState("");
  const [amount, setAmount] = useState<number | null>(null);

  const onReady = useCallback(() => {
    const bale = window.Bale?.WebApp;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("tgWebAppStartParam") ?? params.get("start_param") ?? "";
    if (!bale?.initData || !/^[a-z0-9]{15,50}$/i.test(id)) {
      setStatus("error");
      setMessage("این صفحه باید از پیوند سفارش در مینی‌اپ رسمی بله باز شود.");
      return;
    }
    bale.ready();
    bale.expand?.();
    setOrderId(id);
    setStatus("ready");
    setMessage("برای پرداخت، صورتحساب سفارش را در کیف پول بله باز کن.");
  }, []);

  const checkStatus = useCallback(async (id: string) => {
    const initData = window.Bale?.WebApp?.initData;
    if (!initData) return;
    try {
      const response = await fetch("/api/payment/balepay/status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, initData }), cache: "no-store",
      });
      if (!response.ok) return;
      const result = await response.json() as { paid?: boolean; needsReview?: boolean; pending?: boolean };
      if (result.paid) { setStatus("paid"); setMessage("پرداخت شما توسط سرور بله تأیید شد."); }
      else if (result.needsReview) {
        setStatus("waiting");
        setMessage("وجه دریافت شده، اما سفارش نیازمند بررسی پشتیبانی است. لطفاً دوباره پرداخت نکنید.");
      }
    } catch { /* Keep waiting; no optimistic payment confirmation. */ }
  }, []);

  useEffect(() => {
    if (!orderId || (status !== "waiting" && status !== "opening")) return;
    const t = setInterval(() => { void checkStatus(orderId); }, 5500);
    return () => clearInterval(t);
  }, [orderId, status, checkStatus]);

  async function openInvoice() {
    const bale = window.Bale?.WebApp;
    if (!bale?.initData || !orderId || typeof bale.openInvoice !== "function") {
      setStatus("error");
      setMessage("نسخهٔ بله از پرداخت مینی‌اپ پشتیبانی نمی‌کند. برنامه را به‌روزرسانی کن.");
      return;
    }
    setStatus("opening");
    setMessage("در حال آماده‌سازی صورتحساب کیف پول بله…");
    try {
      let params = invoice;
      if (!params) {
        const response = await fetch("/api/payment/balepay/invoice", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, initData: bale.initData }), cache: "no-store",
        });
        const result = await response.json() as {
          error?: string; invoiceParams?: string; amountRial?: number; paid?: boolean;
        };
        if (!response.ok) throw Error(result.error ?? "ساخت فاکتور انجام نشد");
        if (result.paid) {
          setStatus("paid"); setMessage("سفارش قبلاً پرداخت و تأیید شده است."); return;
        }
        if (!result.invoiceParams) throw Error("شناسهٔ فاکتور دریافت نشد");
        params = result.invoiceParams;
        setInvoice(params);
        setAmount(result.amountRial ?? null);
      }
      // The client callback is UI-only; it NEVER marks an order as paid.
      bale.openInvoice(params, () => {
        setStatus("waiting");
        setMessage("در حال بررسی نتیجهٔ واقعی تراکنش در سرور نقلی‌جان…");
        void checkStatus(orderId);
      });
    } catch (error) {
      setStatus("ready");
      setMessage(error instanceof Error ? error.message : "اتصال به بله برقرار نشد");
    }
  }

  return (
    <section className="customer-access-page mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Script src="https://tapi.bale.ai/miniapp.js" strategy="afterInteractive" onReady={onReady}
        onError={() => { setStatus("error"); setMessage("کتابخانهٔ رسمی مینی‌اپ بله بارگذاری نشد"); }} />
      <div className="customer-panel text-center">
        <p className="customer-eyebrow">✿ NOGHLIJAN · BALE WALLET</p>
        <div className="my-6 text-5xl text-pink-600" aria-hidden="true">♡</div>
        <h1 className="font-display text-4xl text-ink">پرداخت کیف پول بله</h1>
        <p className="mt-4 text-sm leading-9 text-ink-soft" role="status">{message}</p>
        {amount != null && <p className="mt-3 text-sm font-bold text-ink">
          مبلغ: {amount.toLocaleString("fa-IR")} ریال
        </p>}
        {orderId && <p className="mt-2 text-xs text-ink-soft">
          سفارش: <span dir="ltr">{orderId.slice(-10)}</span>
        </p>}
        {status !== "paid" && (status === "ready" || status === "waiting") && (
          <button type="button" className="customer-primary-button mx-auto mt-7"
            onClick={() => void openInvoice()}>
            {status === "waiting" ? "باز کردن مجدد فاکتور" : "پرداخت با کیف پول بله"} ←
          </button>
        )}
        {status === "waiting" && <button type="button" className="mx-auto mt-5 block text-sm text-teal-deep"
          onClick={() => void checkStatus(orderId)}>بررسی دوبارهٔ وضعیت پرداخت</button>}
        {status === "paid" && <p className="mt-6 font-semibold text-teal-deep">
          پرداخت تأیید شده است. وضعیت سفارش در حساب نقلی‌جان ثبت شد.
        </p>}
        <Link href="/account"
          className="mt-9 inline-block text-sm text-ink-soft underline underline-offset-4">
          مشاهدهٔ سفارش در سایت نقلی‌جان
        </Link>
      </div>
    </section>
  );
}
