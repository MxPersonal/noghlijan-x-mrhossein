import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeOrder, verifyNowPayment } from "@/lib/payment-providers";

export const runtime = "nodejs";

function deepSort(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepSort);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Record<string,unknown>).sort()
      .map(key => [key, deepSort((value as Record<string,unknown>)[key])]));
  }
  return value;
}

export async function POST(req: Request) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const signature = req.headers.get("x-nowpayments-sig") ?? "";
  if (!/^[a-f0-9]{128}$/i.test(signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 25_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let data: Record<string,unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("payload");
    data = parsed as Record<string,unknown>;
  } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const expected = createHmac("sha512", secret)
    .update(JSON.stringify(deepSort(data))).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex")))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // A signed IPN is still only a notification. Confirm final payment via merchant API.
  if (data.payment_status !== "finished") return NextResponse.json({ received: true });
  const orderId = typeof data.order_id === "string" ? data.order_id : "";
  const paymentId = String(data.payment_id ?? "");
  const order = await prisma.order.findFirst({
    where: { id: orderId, paymentProvider: "nowpayments" },
  });
  if (!order || !order.paymentUsdAmount || order.status !== "PENDING")
    return NextResponse.json({ received: true });
  if (data.invoice_id != null && String(data.invoice_id) !== order.authority)
    return NextResponse.json({ error: "Invoice mismatch" }, { status: 400 });
  try {
    const verified = await verifyNowPayment({
      paymentId, orderId: order.id, expectedUsd: order.paymentUsdAmount,
    });
    if (!verified.ok) return NextResponse.json({ error: "Verification pending" }, { status: 503 });
    const done = await finalizeOrder(order.id, "nowpayments", verified.refId);
    return NextResponse.json({ received: true, reconciled: done });
  } catch (error) {
    console.error("NOWPayments IPN verification failed", order.id, error);
    return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  }
}
