import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { PaymentCartReconciler } from "@/components/customer/PaymentCartReconciler";

export const dynamic = "force-dynamic";

export default async function PaymentResult({
  searchParams,
}: { searchParams: Promise<{ orderId?: string }> }) {
  const customer = await getCustomer();
  if (!customer) redirect("/login?next=%2Faccount");
  const params = await searchParams;
  const order = params.orderId && params.orderId.length < 80
    ? await prisma.order.findFirst({ where: { id: params.orderId, customerId: customer.id } })
    : null;
  const paid = order && ["PAID", "SHIPPED"].includes(order.status);
  return (
    <div className="glass-surface mx-auto my-16 max-w-lg rounded-3xl px-6 py-12 text-center">
      {paid && order && <PaymentCartReconciler orderId={order.id} />}
      <span className="text-5xl text-teal">{paid ? "✓" : "◷"}</span>
      <h1 className="mt-5 font-display text-4xl text-ink">
        {paid ? "پرداخت تأیید شد" : order ? "در انتظار تأیید درگاه" : "سفارشی یافت نشد"}
      </h1>
      <p className="mt-4 text-sm leading-8 text-ink-soft">
        {paid ? "سفارش شما با موفقیت ثبت شد." : order
          ? order.paymentReviewReason ?? "بازگشت از درگاه به معنای پرداخت موفق نیست. نتیجه پس از استعلام در سرور مشخص می‌شود."
          : "از بخش سفارش‌های من وضعیت خریدتان را بررسی کنید."}
      </p>
      {paid && <p className="mt-3 text-teal">{formatPrice(order.total)}</p>}
      <Link href="/account" className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-white">
        مشاهدهٔ سفارش‌ها
      </Link>
    </div>
  );
}
