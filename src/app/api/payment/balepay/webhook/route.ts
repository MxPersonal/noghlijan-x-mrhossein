import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  baleCall, correctRialAmount, inquireBaleTransaction, isBaleWalletConfigured,
  verifyBaleWebhookSecret,
} from "@/lib/bale-pay";
import { finalizeOrder } from "@/lib/payment-providers";

export const runtime = "nodejs";

/**
 * Configure this URL using setWebhook:
 * https://YOUR-DOMAIN/api/payment/balepay/webhook?key=<BALE_WEBHOOK_SECRET>
 * Bale's published webhook method does not specify a signed-update header;
 * the unguessable URL secret gates inbound updates, and payments are checked
 * independently using the authenticated inquireTransaction method.
 */
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("key");
  if (!verifyBaleWebhookSecret(secret) || !isBaleWalletConfigured()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await req.text();
  if (raw.length > 32_000) return NextResponse.json({ error: "Too large" }, { status: 413 });

  let update: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("Invalid");
    update = parsed as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }

  const pre = update.pre_checkout_query;
  if (pre && typeof pre === "object" && !Array.isArray(pre)) {
    const query = pre as Record<string, unknown>;
    const queryId = query.id;
    if (typeof queryId !== "string" || queryId.length > 150) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    let approved = false;
    try {
      const orderId = query.invoice_payload;
      if (typeof orderId === "string" && /^[a-z0-9]{15,50}$/i.test(orderId)) {
        const order = await prisma.order.findFirst({
          where: { id: orderId, paymentProvider: "balepay", status: "PENDING" },
          include: { items: true },
        });
        const amount = order ? correctRialAmount(order.total) : null;
        if (order?.authority && order.authority !== "bale:" + orderId &&
            query.currency === "IRR" && amount != null &&
            query.total_amount === amount) {
          // Confirm inventory before authorizing payment; actual stock decrement
          // remains atomic during final transaction confirmation.
          const productIds = order.items.map(item => item.productId);
          const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true },
            select: { id: true, stock: true } });
          const variants = await prisma.productVariant.findMany({ where: { id: { in: order.items
            .filter(item => item.variantId).map(item => item.variantId!) } },
            select: { id: true, stock: true } });
          const availableProducts = new Map(products.map(product => [product.id, product.stock]));
          const availableVariants = new Map(variants.map(variant => [variant.id, variant.stock]));
          const totals = new Map<string, number>();
          for (const item of order.items) totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
          const stockAvailable = [...totals].every(([id,qty]) => (availableProducts.get(id) ?? 0) >= qty) &&
            order.items.every(item => !item.variantId ||
              (availableVariants.get(item.variantId) ?? 0) >= item.quantity);
          if (stockAvailable) {
            // The official docs state this ID is repeated as telegram_payment_charge_id
            // after the successful wallet payment. Bind it to this order before approving.
            const captured = await prisma.order.updateMany({
              where: {
                id: order.id, status: "PENDING", paymentProvider: "balepay",
                OR: [{ refId: null }, { refId: queryId }],
              },
              data: { refId: queryId },
            });
            approved = captured.count === 1;
          }
        }
      }
    } catch (error) {
      console.error("Bale pre-checkout validation error", error);
    }

    try {
      const answer = await baleCall<boolean>("answerPreCheckoutQuery", {
        pre_checkout_query_id: queryId,
        ok: approved,
        ...(!approved ? { error_message: "این سفارش یا موجودی آن معتبر نیست. به فروشگاه بازگردید." } : {}),
      });
      if (!answer.ok) return NextResponse.json({ error: "Cannot answer pre-checkout" }, { status: 502 });
    } catch (error) {
      console.error("Bale pre-checkout response error", error);
      return NextResponse.json({ error: "Gateway unavailable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message || typeof message !== "object" || Array.isArray(message))
    return NextResponse.json({ ok: true });
  const msg = message as Record<string, unknown>;
  const value = msg.successful_payment;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return NextResponse.json({ ok: true });
  const payment = value as Record<string, unknown>;
  const orderId = payment.invoice_payload;
  const transactionId = payment.telegram_payment_charge_id;
  if (typeof orderId !== "string" || !/^[a-z0-9]{15,50}$/i.test(orderId) ||
      typeof transactionId !== "string" || transactionId.length < 5 ||
      transactionId.length > 150 || payment.currency !== "IRR") {
    return NextResponse.json({ error: "Invalid payment receipt" }, { status: 400 });
  }
  const order = await prisma.order.findFirst({
    where: { id: orderId, paymentProvider: "balepay" },
  });
  if (!order) return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  if (order.status === "PAID" || order.status === "SHIPPED") return NextResponse.json({ ok: true });
  const rial = correctRialAmount(order.total);
  if (order.status !== "PENDING" || !rial || rial !== payment.total_amount ||
      !order.authority || order.authority === "bale:" + orderId ||
      order.refId !== transactionId)
    return NextResponse.json({ error: "Order payment mismatch" }, { status: 409 });
  try {
    const verified = await inquireBaleTransaction(transactionId);
    if (!verified || verified.id !== transactionId || verified.status !== "paid" ||
        verified.amount !== rial) {
      return NextResponse.json({ error: "Transaction not independently verified" }, { status: 503 });
    }
    const confirmed = await finalizeOrder(order.id, "balepay", String(payment.provider_payment_charge_id || transactionId));
    if (!confirmed) return NextResponse.json({ error: "Payment requires manual reconciliation" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bale independent transaction verification failed", order.id, error);
    return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  }
}
