import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isZarinpalConfigured, requestPayment } from "@/lib/zarinpal";

type Body = {
  customerName?: string;
  phone?: string;
  address?: string;
  items?: { productId: string; quantity: number }[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }

  const customerName = body.customerName?.trim();
  const phone = body.phone?.trim();
  const address = body.address?.trim();
  const items = body.items ?? [];

  if (!customerName || !phone || !address || items.length === 0) {
    return NextResponse.json(
      { error: "لطفاً همه فیلدها را پر کنید" },
      { status: 400 },
    );
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "یکی از محصولات یافت نشد" },
      { status: 400 },
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  let total = 0;
  const orderItems: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "محصول نامعتبر" }, { status: 400 });
    }
    if (item.quantity < 1) {
      return NextResponse.json({ error: "تعداد نامعتبر" }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `موجودی «${product.name}» کافی نیست` },
        { status: 400 },
      );
    }
    total += product.price * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      phone,
      address,
      total,
      status: "PENDING",
      items: { create: orderItems },
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  if (!isZarinpalConfigured()) {
    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", refId: `DEMO-${order.id.slice(-6)}` },
      });
    });

    return NextResponse.json({
      orderId: order.id,
      demo: true,
    });
  }

  const payment = await requestPayment({
    amount: total,
    description: `سفارش کلوث استور ${order.id}`,
    callbackUrl: `${appUrl}/payment/verify`,
    mobile: phone,
  });

  if ("error" in payment) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "خطا در اتصال به درگاه پرداخت" },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { authority: payment.authority },
  });

  return NextResponse.json({
    orderId: order.id,
    paymentUrl: payment.paymentUrl,
  });
}
