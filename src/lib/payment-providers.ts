import "server-only";
import { prisma } from "@/lib/prisma";
import { isZarinpalConfigured, requestPayment as requestZarinpal } from "@/lib/zarinpal";

export type PaymentMethod = "zarinpal" | "aqayepardakht" | "balepay" | "nowpayments";
export type MethodOption = { id: PaymentMethod; title: string; description: string; available: boolean; setupHint?: string };

export function usdQuoteRate(): number | null {
  // Only an explicitly approved, time-limited price conversion may be used.
  // NEVER silently convert toman to USD using an invented/live-unverified FX rate.
  const raw = process.env.CRYPTO_USD_TOMAN_RATE;
  const until = process.env.CRYPTO_RATE_VALID_UNTIL;
  const rate = Number(raw);
  const expiry = Date.parse(until ?? "");
  if (!raw || !Number.isFinite(rate) || rate <= 1000 ||
      !Number.isFinite(expiry) || expiry < Date.now() ||
      expiry > Date.now() + 48 * 60 * 60 * 1000) return null;
  return rate;
}

export function availableMethod(method: PaymentMethod): boolean {
  switch (method) {
    case "zarinpal": return isZarinpalConfigured();
    case "aqayepardakht": return Boolean(process.env.AQAYEPARDAKHT_PIN?.trim());
    case "nowpayments":
      // Merchant must establish that NOWPayments is available in their actual jurisdiction.
      // Their published terms exclude some jurisdictions, including Iran.
      return Boolean(process.env.NOWPAYMENTS_COMPLIANCE_APPROVED === "true" &&
        process.env.NOWPAYMENTS_API_KEY?.trim() &&
        process.env.NOWPAYMENTS_IPN_SECRET?.trim() && usdQuoteRate());
    case "balepay": return false; // No verified independent merchant API contract.
  }
}

export function paymentMethods(): MethodOption[] {
  return [
    { id: "zarinpal", title: "زرین‌پال", description: "پرداخت آنلاین با کارت بانکی",
      available: availableMethod("zarinpal"), setupHint: "ZARINPAL_MERCHANT_ID" },
    { id: "aqayepardakht", title: "آقای پرداخت", description: "پرداخت اینترنتی ریالی",
      available: availableMethod("aqayepardakht"), setupHint: "AQAYEPARDAKHT_PIN" },
    { id: "balepay", title: "بله‌پی", description: "در انتظار مستندات معتبر پذیرندگی",
      available: false, setupHint: "نیازمند مستندات رسمی API بله‌پی" },
    { id: "nowpayments", title: "پرداخت رمزارزی", description: "صورتحساب رمزارزی از طریق NOWPayments",
      available: availableMethod("nowpayments"),
      setupHint: "Eligibility + NOWPAYMENTS_API_KEY + NOWPAYMENTS_IPN_SECRET + CRYPTO_USD_TOMAN_RATE + CRYPTO_RATE_VALID_UNTIL" },
  ];
}

function secureHttps(value: string, allowedHosts: string[]) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.some(host => url.hostname === host || url.hostname.endsWith("." + host));
  } catch { return false; }
}

async function postJson(url: string, body: unknown, headers: Record<string,string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
      body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    return { ok: res.ok, data };
  } finally { clearTimeout(timeout); }
}

function obj(value: unknown): Record<string,unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : {};
}

export type PaymentStart = { ok: true; url: string; authority: string; usdAmount?: number }
  | { ok: false; error: string };

export async function startPayment(input: {
  method: PaymentMethod; orderId: string; totalToman: number; mobile: string; baseUrl: string;
}): Promise<PaymentStart> {
  if (!availableMethod(input.method)) return { ok: false, error: "درگاه انتخاب‌شده هنوز فعال نیست" };
  const { method, totalToman, orderId, baseUrl } = input;
  if (!Number.isSafeInteger(totalToman) || totalToman < 100) {
    return { ok: false, error: "مبلغ پرداخت معتبر نیست" };
  }
  if (method === "zarinpal") {
    const result = await requestZarinpal({ amount: totalToman, description: "سفارش نقلی‌جان " + orderId,
      callbackUrl: baseUrl + "/payment/verify", mobile: input.mobile });
    if ("error" in result) return { ok: false, error: "خطا در ثبت درخواست زرین‌پال" };
    return { ok: true, url: result.paymentUrl, authority: result.authority };
  }
  if (method === "aqayepardakht") {
    const response = await postJson("https://panel.aqayepardakht.ir/api/v2/create", {
      pin: process.env.AQAYEPARDAKHT_PIN,
      amount: totalToman, // Published API uses toman.
      callback: baseUrl + "/api/payment/aqayepardakht/callback",
      invoice_id: orderId, mobile: input.mobile,
      description: "سفارش نقلی‌جان " + orderId,
    });
    const data = obj(response.data);
    const transid = typeof data.transid === "string" ? data.transid : String(data.transid ?? "");
    if (!response.ok || data.status !== "success" || !/^[a-zA-Z0-9_-]{8,150}$/.test(transid)) {
      return { ok: false, error: "درخواست آقای پرداخت پذیرفته نشد" };
    }
    return { ok: true, authority: transid,
      url: "https://panel.aqayepardakht.ir/startpay/" + encodeURIComponent(transid) };
  }
  if (method === "nowpayments") {
    const rate = usdQuoteRate();
    if (!rate) return { ok: false, error: "نرخ معتبر تبدیل ارز ثبت نشده است" };
    const usd = Math.round((totalToman / rate) * 100) / 100;
    if (usd <= 0) return { ok: false, error: "مبلغ رمزارزی بسیار کم است" };
    const response = await postJson("https://api.nowpayments.io/v1/invoice", {
      price_amount: usd, price_currency: "usd",
      order_id: orderId, order_description: "Noghlijan order " + orderId,
      ipn_callback_url: baseUrl + "/api/payment/nowpayments/ipn",
      success_url: baseUrl + "/payment/result?orderId=" + encodeURIComponent(orderId),
      cancel_url: baseUrl + "/payment/result?orderId=" + encodeURIComponent(orderId),
    }, { "x-api-key": process.env.NOWPAYMENTS_API_KEY! });
    const data = obj(response.data);
    const invoiceUrl = typeof data.invoice_url === "string" ? data.invoice_url : "";
    const id = typeof data.id === "string" || typeof data.id === "number" ? String(data.id) : "";
    if (!response.ok || !id || !secureHttps(invoiceUrl, ["nowpayments.io"])) {
      return { ok: false, error: "صورتحساب رمزارزی ایجاد نشد؛ مبلغ یا حساب پذیرنده را بررسی کنید" };
    }
    return { ok: true, authority: id, usdAmount: usd, url: invoiceUrl };
  }
  return { ok: false, error: "برای بله‌پی هنوز API قابل تأیید موجود نیست" };
}

/** Payment confirmation always happens server-to-server, never from query flags. */
export async function verifyAqayepardakht(input: { transid: string; amountToman: number }) {
  if (!availableMethod("aqayepardakht")) return { ok: false as const, refId: "" };
  const result = await postJson("https://panel.aqayepardakht.ir/api/v2/verify", {
    pin: process.env.AQAYEPARDAKHT_PIN,
    amount: input.amountToman,
    transid: input.transid,
  });
  const data = obj(result.data);
  return { ok: result.ok && data.status === "success", refId: String(data.tracking_number ?? input.transid) };
}

/** Verify the received crypto status directly against NOWPayments' authenticated API. */
export async function verifyNowPayment(input: { paymentId: string; orderId: string; expectedUsd: number }) {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key || !/^[0-9]{1,35}$/.test(input.paymentId)) return { ok: false, refId: "" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.nowpayments.io/v1/payment/" + encodeURIComponent(input.paymentId),
      { headers: { "x-api-key": key }, cache: "no-store", signal: controller.signal });
    const data = obj(res.ok ? await res.json() as unknown : null);
    const price = Number(data.price_amount);
    return {
      ok: res.ok && data.payment_status === "finished" && data.order_id === input.orderId &&
        String(data.price_currency).toLowerCase() === "usd" && Number.isFinite(price) &&
        Math.abs(price - input.expectedUsd) < .011,
      refId: String(data.payment_id ?? ""),
    };
  } finally { clearTimeout(timeout); }
}

/** Mark paid with order+inventory updates in ONE idempotent transaction. */
export async function finalizeOrder(orderId: string, provider: PaymentMethod, reference: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.paymentProvider !== provider || !reference || reference.length > 160) return false;
  if (order.status === "PAID" || order.status === "SHIPPED") return true;
  if (order.status !== "PENDING") return false;
  let processed = false;
  try {
    await prisma.$transaction(async tx => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING", paymentProvider: provider },
        data: { status: "PAID", refId: reference, paymentVerifiedAt: new Date(), paymentReviewReason: null },
      });
      if (!claimed.count) return;
      processed = true;
      for (const item of order.items) {
        const product = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (product.count !== 1) throw Error("Insufficient product inventory");
        if (item.variantId) {
          const variant = await tx.productVariant.updateMany({
            where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variant.count !== 1) throw Error("Insufficient variant inventory");
        }
      }
    });
    if (processed) return true;
    const latest = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    return latest?.status === "PAID" || latest?.status === "SHIPPED";
  } catch (error) {
    console.error("Verified payment needs stock reconciliation", orderId, provider, error);
    await prisma.order.updateMany({ where: { id: orderId, status: "PENDING" },
      data: { paymentReviewReason: "پرداخت تأیید شده اما موجودی برای کسر کافی نیست؛ بررسی دستی ضروری است." } });
    return false;
  }
}
