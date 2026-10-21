import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomer, publicCustomer } from "@/lib/customer-auth";
import { CustomerProfile } from "@/components/customer/CustomerProfile";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "حساب کاربری من", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/login?next=%2Faccount");
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id }, orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true } } } } },
    take: 30,
  });
  const labels: Record<string,string>={PENDING:"در انتظار پرداخت",PAID:"پرداخت شده",FAILED:"ناموفق",SHIPPED:"ارسال شده"};
  return (
    <div className="customer-account-page mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="customer-account-banner">
        <p className="customer-eyebrow">✿ NOGHLIJAN · MY ACCOUNT</p>
        <h1>سلام <span>{customer.fullName}</span>!</h1>
        <p>اینجا همه چیز برای یک تجربهٔ خرید راحت و شیرین آماده است.</p>
        <div><Link href="/shop">دیدن فروشگاه ↗</Link><Link href="/cart">سبد خرید ←</Link></div>
      </div>
      <div className="customer-account-grid">
        <CustomerProfile initial={publicCustomer(customer)} />
        <section className="customer-panel customer-orders-panel">
          <p className="customer-eyebrow">✿ YOUR ORDERS</p>
          <h2>سفارش‌های من</h2>
          {orders.length ? <ul className="customer-order-list">
            {orders.map(order=><li key={order.id}>
              <div><strong>سفارش #{order.id.slice(-8).toUpperCase()}</strong>
                <span>{labels[order.status]??order.status}</span></div>
              <p>{formatDate(order.createdAt)} · {formatPrice(order.total)}</p>
              <p>کد پستی: {order.postalCode||"ثبت نشده"}</p>
              <ul>{order.items.map(i=><li key={i.id}>
                {i.product.name}{i.variantLabel?" · "+i.variantLabel:""} × {i.quantity.toLocaleString("fa-IR")}
              </li>)}</ul>
            </li>)}
          </ul>:<div className="customer-orders-empty"><span aria-hidden="true">✿</span>
            <p>هنوز سفارشی نداری؛ لباس‌های دوست‌داشتنی منتظرت هستند.</p>
            <Link href="/shop">رفتن به فروشگاه ←</Link></div>}
        </section>
      </div>
    </div>
  );
}
