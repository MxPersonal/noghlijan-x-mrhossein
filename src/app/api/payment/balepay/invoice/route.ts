import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { baleCall, correctRialAmount, isBaleWalletConfigured, verifyBaleInitData } from "@/lib/bale-pay";
import { sameOrigin } from "@/lib/customer-auth";

export const runtime = "nodejs";

/** Only accessible from an authenticated Bale miniapp session. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!isBaleWalletConfigured()) return NextResponse.json({ error: "پرداخت بله هنوز فعال نشده است" }, { status: 503 });
  let data: { orderId?: unknown; initData?: unknown };
  try { data = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!verifyBaleInitData(data.initData)) return NextResponse.json({ error: "لطفاً از مینی‌اپ رسمی بله وارد شوید" }, { status: 401 });
  const orderId = data.orderId;
  if (typeof orderId !== "string" || !/^[a-z0-9]{15,50}$/i.test(orderId)) {
    return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentProvider !== "balepay") {
    return NextResponse.json({ error: "سفارش بله یافت نشد" }, { status: 404 });
  }
  if (order.status === "PAID" || order.status === "SHIPPED") return NextResponse.json({ paid: true });
  if (order.status !== "PENDING") return NextResponse.json({ error: "سفارش قابل پرداخت نیست" }, { status: 409 });
  const rial = correctRialAmount(order.total);
  if (!rial || rial < 1000) return NextResponse.json({ error: "مبلغ سفارش معتبر نیست" }, { status: 422 });
  const startingAuthority = "bale:" + order.id;
  if (order.authority && order.authority !== startingAuthority && order.authority.length <= 2048) {
    return NextResponse.json({ invoiceParams: order.authority, amountRial: rial });
  }
  if (order.authority !== startingAuthority) {
    return NextResponse.json({ error: "پرداخت این سفارش از بله شروع نشده است" }, { status: 409 });
  }
  try {
    const answer = await baleCall<string>("createInvoiceLink", {
      title: "سفارش نقلی‌جان",
      description: "پرداخت کیف پول بله برای سفارش " + order.id,
      payload: order.id,
      provider_token: process.env.BALE_WALLET_PROVIDER_TOKEN,
      prices: [{ label: "خرید از نقلی‌جان", amount: rial }],
    });
    const params = answer.result;
    if (!answer.ok || typeof params !== "string" || params.length < 5 || params.length > 2048)
      return NextResponse.json({ error: "ایجاد فاکتور در بله ناموفق بود" }, { status: 502 });
    const claimed = await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING", authority: startingAuthority, paymentProvider: "balepay" },
      data: { authority: params },
    });
    if (!claimed.count) {
      const latest = await prisma.order.findUnique({ where: { id: order.id } });
      if (!latest || latest.status !== "PENDING" || !latest.authority ||
          latest.authority === startingAuthority)
        return NextResponse.json({ error: "پرداخت سفارش دیگر در انتظار نیست" }, { status: 409 });
      return NextResponse.json({ invoiceParams: latest.authority, amountRial: rial });
    }
    return NextResponse.json({ invoiceParams: params, amountRial: rial });
  } catch (error) {
    console.error("Bale invoice creation failed", order.id, error);
    return NextResponse.json({ error: "ارتباط با کیف پول بله برقرار نشد" }, { status: 502 });
  }
}
