import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { verifyPayment } from "@/lib/zarinpal";
import { finalizeOrder } from "@/lib/payment-providers";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PaymentVerifyPage({
  searchParams,
}: { searchParams: Promise<{ Authority?: string; Status?: string }> }) {
  const { Authority, Status } = await searchParams;
  const customer = await getCustomer();
  if (!customer) return <Result title="ابتدا وارد حساب شوید"
    detail="برای دیدن وضعیت سفارش باید وارد حساب خودتان شوید." href="/login?next=%2Faccount" />;
  if (!Authority || Authority.length > 140) return <Result title="شناسهٔ پرداخت نامعتبر است"
    detail="برای پیگیری وضعیت، به قسمت سفارش‌های من مراجعه کنید." />;
  const order = await prisma.order.findFirst({
    where: { authority: Authority, paymentProvider: "zarinpal", customerId: customer.id },
  });
  if (!order) return <Result title="سفارش پیدا نشد"
    detail="پرداختی با این مشخصات در حساب شما ثبت نشده است." />;
  if (order.status === "PAID" || order.status === "SHIPPED") return <Result ok title="پرداخت تأیید شده"
    detail={"شناسهٔ پیگیری: " + (order.refId ?? "ثبت شده")} amount={order.total} />;
  if (order.status !== "PENDING") return <Result title="درخواست پرداخت ناموفق یا منقضی است"
    detail="می‌توانید وضعیت سفارش را در حساب خود ببینید." />;
  if (Status !== "OK") return <Result title="پرداخت تکمیل نشد"
    detail="اگر وجهی کسر شده، وضعیت نهایی را از بانک و پشتیبانی درگاه پیگیری کنید." />;

  try {
    const verified = await verifyPayment({ authority: Authority, amount: order.total });
    if (!verified.ok) return <Result title="پرداخت هنوز تأیید نشده"
      detail="تا زمانی که پاسخ معتبر درگاه دریافت نشود، سفارش پرداخت‌شده محسوب نمی‌شود." />;
    const finalized = await finalizeOrder(order.id, "zarinpal", verified.refId);
    return finalized
      ? <Result ok title="پرداخت موفق" detail={"کد پیگیری: " + verified.refId} amount={order.total} />
      : <Result title="پرداخت نیازمند بررسی است" detail="پرداخت تأیید شده، اما ثبت نهایی موجودی نیازمند بررسی پشتیبانی است. لطفاً دوباره پرداخت نکنید." />;
  } catch (error) {
    console.error("ZarinPal verification error", error);
    return <Result title="بررسی پرداخت موقتاً ممکن نیست"
      detail="پرداخت جدید انجام ندهید؛ ابتدا وضعیت سفارش را از حساب خود پیگیری کنید." />;
  }
}

function Result({ title, detail, ok = false, amount, href = "/account" }:
  { title: string; detail: string; ok?: boolean; amount?: number; href?: string }) {
  return (
    <div className="glass-surface mx-auto my-16 max-w-lg rounded-3xl px-6 py-12 text-center sm:px-10">
      <div className={"mx-auto mb-6 grid size-16 place-items-center rounded-full text-3xl text-white " +
        (ok ? "bg-teal" : "bg-peach")}>{ok ? "✓" : "!"}</div>
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="mt-3 leading-8 text-ink-soft">{detail}</p>
      {amount != null && <p className="mt-3 text-teal-deep">{formatPrice(amount)}</p>}
      <Link href={href} className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white">
        مشاهدهٔ حساب کاربری
      </Link>
    </div>
  );
}
