import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isZarinpalConfigured, requestPayment } from "@/lib/zarinpal";
import { variantLabel } from "@/lib/product-variants";
import { getCustomer, normalizeMobile, normalizePostal, sameOrigin } from "@/lib/customer-auth";

type Body = {
  address?: string;
  postalCode?: string;
  recipientIsOther?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  saveAddress?: boolean;
  items?: { productId: string; variantId?: string; quantity: number }[];
};

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "درخواست نامعتبر است" }, { status: 403 });
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "ابتدا وارد حساب خود شوید" }, { status: 401 });
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 }); }

  const customerName = customer.fullName;
  const phone = customer.mobile;
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const postalCode = normalizePostal(body.postalCode);
  const recipientIsOther = body.recipientIsOther === true;
  const recipientName = recipientIsOther && typeof body.recipientName === "string" ? body.recipientName.trim() : null;
  const recipientPhone = recipientIsOther ? normalizeMobile(body.recipientPhone) : null;
  const items = body.items ?? [];
  if (address.length < 12 || address.length > 700 || !postalCode ||
      (recipientIsOther && (!recipientName || recipientName.length < 3 ||
        recipientName.length > 120 || !recipientPhone)) ||
      !Array.isArray(items) || items.length === 0 || items.length > 50) {
    return NextResponse.json({ error: "آدرس کامل، کد پستی ۱۰ رقمی و در صورت نیاز اطلاعات گیرنده الزامی و معتبرند" }, { status: 422 });
  }
  // Never mark production purchases as paid when a payment gateway is missing.
  if (process.env.NODE_ENV === "production" && !isZarinpalConfigured()) {
    return NextResponse.json({ error: "درگاه پرداخت فروشگاه هنوز فعال نشده است؛ لطفاً بعداً تلاش کنید." }, { status: 503 });
  }

  // Prices, availability, and variant ownership are always verified server-side.
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  if (items.some(item => typeof item.productId !== "string" || !Number.isSafeInteger(item.quantity)
       || item.quantity < 1 || item.quantity > 99)) {
    return NextResponse.json({ error: "تعداد یا شناسهٔ محصول نامعتبر است" }, { status: 400 });
  }
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "یکی از محصولات یافت نشد" }, { status: 400 });
  }
  const variants = await prisma.productVariant.findMany({
    where: { productId: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  const productsWithVariants = new Set(variants.map(variant => variant.productId));
  const merged = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const item of items) {
    const key = item.productId + ":" + (item.variantId || "");
    const existing = merged.get(key);
    merged.set(key, { productId: item.productId, variantId: item.variantId,
      quantity: (existing?.quantity ?? 0) + item.quantity });
  }
  let total = 0;
  const orderItems: {
    productId: string;
    variantId: string | null;
    variantLabel: string | null;
    quantity: number;
    unitPrice: number;
  }[] = [];
  const quantityByProduct = new Map<string, number>();

  for (const item of merged.values()) {
    const product = productMap.get(item.productId);
    if (!product) return NextResponse.json({ error: "محصول نامعتبر" }, { status: 400 });
    const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
    if (productsWithVariants.has(product.id) && !variant) {
      return NextResponse.json({ error: "لطفاً رنگ یا ویژگی محصول را انتخاب کنید" }, { status: 400 });
    }
    if ((item.variantId && !variant) || (variant && variant.productId !== product.id)) {
      return NextResponse.json({ error: "ترکیب انتخاب‌شده معتبر نیست" }, { status: 400 });
    }
    if (variant && variant.stock < item.quantity) {
      return NextResponse.json({ error: "موجودی این رنگ یا سایز کافی نیست" }, { status: 400 });
    }
    const unitPrice = variant?.price ?? product.price;
    total += unitPrice * item.quantity;
    quantityByProduct.set(product.id, (quantityByProduct.get(product.id) ?? 0) + item.quantity);
    orderItems.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      variantLabel: variant ? variantLabel(variant) : null,
      quantity: item.quantity,
      unitPrice,
    });
  }
  for (const [id, quantity] of quantityByProduct) {
    const product = productMap.get(id);
    if (!product || product.stock < quantity) {
      return NextResponse.json({ error: "موجودی یکی از محصولات کافی نیست" }, { status: 400 });
    }
  }

  const order = await prisma.order.create({
    data: {
      customerName,
      phone,
      address,
      postalCode,
      recipientIsOther,
      recipientName,
      recipientPhone,
      customerId: customer.id,
      total,
      status: "PENDING",
      items: { create: orderItems },
    },
  });

  if (body.saveAddress === true) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { address, postalCode },
    });
  }

  // Use the actual HTTPS storefront origin when no canonical URL is configured.
  // Production payment callbacks must never point to localhost.
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallbackOrigin = new URL(req.url).origin;
  const appUrl = configuredUrl && /^https:\/\//i.test(configuredUrl)
    ? configuredUrl.replace(/\/$/, "")
    : fallbackOrigin;
  if (process.env.NODE_ENV === "production" && !appUrl.startsWith("https://")) {
    return NextResponse.json({ error: "آدرس امن بازگشت پرداخت تنظیم نشده است" }, { status: 503 });
  }

  if (!isZarinpalConfigured()) {
    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const product = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (product.count !== 1) throw new Error("موجودی کافی نیست");
        if (item.variantId) {
          const variant = await tx.productVariant.updateMany({
            where: { id: item.variantId, productId: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variant.count !== 1) throw new Error("موجودی رنگ یا سایز کافی نیست");
        }
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
    description: `سفارش نقلی‌جان ${order.id}`,
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
