import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isBaleWalletConfigured, verifyBaleInitData } from "@/lib/bale-pay";
import { sameOrigin } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isBaleWalletConfigured()) return NextResponse.json({ error: "Bale not ready" }, { status: 503 });
  let body: { orderId?: unknown; initData?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!verifyBaleInitData(body.initData)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (typeof body.orderId !== "string" || !/^[a-z0-9]{15,50}$/i.test(body.orderId))
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    select: { status: true, paymentProvider: true, paymentReviewReason: true },
  });
  if (!order || order.paymentProvider !== "balepay") return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    paid: order.status === "PAID" || order.status === "SHIPPED",
    pending: order.status === "PENDING",
    needsReview: Boolean(order.paymentReviewReason),
  }, { headers: { "Cache-Control": "no-store" } });
}
