import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isZarinpalConfigured, verifyPayment } from "@/lib/zarinpal";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  Authority?: string;
  Status?: string;
  demo?: string;
  orderId?: string;
}>;

export default async function PaymentVerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (params.demo === "1" && params.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order || order.status !== "PAID") {
      return (
        <Result
          ok={false}
          title="سفارش یافت نشد"
          message="سفارش دمو معتبر نیست."
        />
      );
    }

    return (
      <Result
        ok
        title="پرداخت موفق (حالت دمو)"
        message={`سفارش شما ثبت شد. چون درگاه زرین‌پال تنظیم نشده، پرداخت به‌صورت آزمایشی تأیید شده است. کد پیگیری: ${order.refId}`}
        amount={order.total}
      />
    );
  }

  const authority = params.Authority;
  const status = params.Status;

  if (!authority) {
    return (
      <Result
        ok={false}
        title="اطلاعات ناقص"
        message="شناسه پرداخت دریافت نشد."
      />
    );
  }

  if (status !== "OK") {
    const order = await prisma.order.findFirst({ where: { authority } });
    if (order && order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }
    return (
      <Result
        ok={false}
        title="پرداخت لغو شد"
        message="پرداخت توسط کاربر لغو شد یا ناموفق بود."
      />
    );
  }

  if (!isZarinpalConfigured()) {
    return (
      <Result
        ok={false}
        title="درگاه تنظیم نشده"
        message="Merchant ID زرین‌پال تعریف نشده است."
      />
    );
  }

  const order = await prisma.order.findFirst({
    where: { authority },
    include: { items: true },
  });

  if (!order) {
    return (
      <Result ok={false} title="سفارش یافت نشد" message="سفارشی با این شناسه نیست." />
    );
  }

  if (order.status === "PAID") {
    return (
      <Result
        ok
        title="پرداخت قبلاً تأیید شده"
        message={`کد پیگیری: ${order.refId}`}
        amount={order.total}
      />
    );
  }

  const verified = await verifyPayment({
    authority,
    amount: order.total,
  });

  if (!verified.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    return (
      <Result
        ok={false}
        title="تأیید پرداخت ناموفق"
        message="درگاه پرداخت را تأیید نکرد."
      />
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", refId: verified.refId },
    });
  });

  return (
    <Result
      ok
      title="پرداخت موفق"
      message={`سفارش شما ثبت شد. کد پیگیری: ${verified.refId}`}
      amount={order.total}
    />
  );
}

function Result({
  ok,
  title,
  message,
  amount,
}: {
  ok: boolean;
  title: string;
  message: string;
  amount?: number;
}) {
  return (
    <div className="glass-surface mx-auto my-16 max-w-lg rounded-3xl px-6 py-12 text-center sm:px-10">
      <div
        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white ${
          ok ? "bg-teal" : "bg-peach"
        }`}
      >
        {ok ? "✓" : "!"}
      </div>
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="mt-3 leading-7 text-ink-soft">{message}</p>
      {amount != null ? (
        <p className="mt-2 text-teal-deep">{formatPrice(amount)}</p>
      ) : null}
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white hover:bg-teal-deep"
      >
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
