import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeOrder, verifyIrCrypto } from "@/lib/payment-providers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.IRCRYPTO_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const header = req.headers.get("ir-signature") ?? "";
  const parsedSignature = Object.fromEntries(header.split(",").map(part => part.trim().split("=", 2)));
  const timestamp = parsedSignature.t ?? "";
  const signature = parsedSignature.v1 ?? "";
  const ts = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Math.floor(Date.now()/1000)-ts) > 300 ||
      !/^[0-9a-f]{64}$/i.test(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const raw = await req.text();
  if (raw.length > 40_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const expected = createHmac("sha256", secret).update(timestamp + "." + raw).digest("hex");
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let data: Record<string,unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("bad");
    data = parsed as Record<string,unknown>;
  } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (data.type !== "invoice.paid" || !data.data || typeof data.data !== "object")
    return NextResponse.json({ accepted: true });
  const detail = data.data as Record<string,unknown>;
  const invoiceId = detail.resource_id;
  if (typeof invoiceId !== "string" || !/^[0-9a-f-]{36}$/i.test(invoiceId))
    return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  const order = await prisma.order.findFirst({
    where: { paymentProvider: "ircryptopay", authority: invoiceId },
  });
  if (!order || order.status === "PAID" || order.status === "SHIPPED")
    return NextResponse.json({ accepted: true });
  if (order.status !== "PENDING") return NextResponse.json({ accepted: true });

  try {
    const checked = await verifyIrCrypto({
      invoiceId, orderId: order.id, totalToman: order.total,
    });
    if (!checked.ok) return NextResponse.json({ error: "Invoice not verified" }, { status: 503 });
    const saved = await finalizeOrder(order.id, "ircryptopay", checked.refId);
    return NextResponse.json({ accepted: true, reconciled: saved });
  } catch (error) {
    console.error("Iranian crypto gateway verification error", invoiceId, error);
    return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  }
}
