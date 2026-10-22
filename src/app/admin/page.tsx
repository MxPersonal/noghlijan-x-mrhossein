import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { isAdminAuthenticated } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { SiteContentEditor } from "@/components/admin/SiteContentEditor";
import { AdminPaymentMethods } from "@/components/admin/AdminPaymentMethods";
import { paymentMethods } from "@/lib/payment-providers";
import { getSiteContent } from "@/lib/site-content";
import { isMissingVariantStorage } from "@/lib/product-variants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "پنل مدیریت",
};

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const authed = await isAdminAuthenticated();
  const params = await searchParams;
  const tab = params.tab === "orders" ? "orders" : params.tab === "content" ? "content" : params.tab === "payments" ? "payments" : "products";

  if (!authed) {
    return (
      <div className="admin-page admin-studio admin-studio--login mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-7 lg:px-10">
        <div className="admin-login-grid">
          <div className="admin-login-intro">
            <div className="admin-login-brand">
              <BrandWordmark className="brand-wordmark--login" />
              <span className="admin-eyebrow">NOGHLIJAN STUDIO</span>
            </div>
            <h1 className="admin-intro-title">مدیریتِ دنیای <span>کوچولوها</span></h1>
            <p>همان رنگ‌ها، همان حس خوب؛ اینجا پشت صحنهٔ فروشگاه نقلی‌جان است، جایی که محصولات و سفارش‌ها با خیال راحت مدیریت می‌شوند.</p>
            <AdminArtwork />
            <span className="admin-brand-note">با عشق، از ویترین تا پشت صحنه ✦</span>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  if (tab === "content") {
    const content = await getSiteContent();
    return (
      <div className="admin-page admin-studio mx-auto w-full max-w-[1440px] px-4 pb-16 pt-5 sm:px-7 lg:px-10">
        <AdminNav tab="content" />
        <AdminWelcome
          tab="content"
          metrics={[
            { label: "صفحهٔ قابل ویرایش", value: 3, icon: "✿" },
            { label: "لینک مسیریاب", value: content.maps.filter(item => !!item.url).length, icon: "⌖" },
            { label: "شبکهٔ اجتماعی", value: content.socials.filter(item => !!item.url).length, icon: "↗" },
            { label: "بخش قوانین", value: content.termsSections.length, icon: "▤" },
          ]}
        />
        <SiteContentEditor initial={content} />
      </div>
    );
  }

  if (tab === "payments") {
    const methods = paymentMethods();
    return (
      <div className="admin-page admin-studio mx-auto w-full max-w-[1440px] px-4 pb-16 pt-5 sm:px-7 lg:px-10">
        <AdminNav tab="payments" />
        <AdminWelcome
          tab="payments"
          metrics={[
            { label: "روش پرداخت", value: methods.length, icon: "◈" },
            { label: "درگاه فعال", value: methods.filter(m => m.available).length, icon: "✓" },
            { label: "منتظر اتصال", value: methods.filter(m => !m.available).length, icon: "◷" },
            { label: "پرداخت رمزارزی", value: methods.some(m => m.id === "nowpayments" && m.available) ? 1 : 0, icon: "₿" },
          ]}
        />
        <AdminPaymentMethods methods={methods} />
      </div>
    );
  }

  if (tab === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return (
      <div className="admin-page admin-studio mx-auto w-full max-w-[1440px] px-4 pb-16 pt-5 sm:px-7 lg:px-10">
        <AdminNav tab="orders" />
        <AdminWelcome
          tab="orders"
          metrics={[
            { label: "کل سفارش‌ها", value: orders.length, icon: "✿" },
            { label: "در انتظار", value: orders.filter(o => o.status === "PENDING").length, icon: "◷" },
            { label: "پرداخت‌شده", value: orders.filter(o => o.status === "PAID").length, icon: "✓" },
            { label: "ارسال‌شده", value: orders.filter(o => o.status === "SHIPPED").length, icon: "↗" },
          ]}
        />
        <AdminOrders
          initial={orders.map((o) => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
          }))}
        />
      </div>
    );
  }

  let products;
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
        tags: { orderBy: { name: "asc" } },
        labels: { orderBy: { name: "asc" } },
      },
    });
  } catch (error) {
    if (!isMissingVariantStorage(error)) throw error;
    const legacy = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        tags: { orderBy: { name: "asc" } },
        labels: { orderBy: { name: "asc" } },
      },
    });
    products = legacy.map(p => ({ ...p, variants: [] }));
  }

  return (
    <div className="admin-page admin-studio mx-auto w-full max-w-[1440px] px-4 pb-16 pt-5 sm:px-7 lg:px-10">
      <AdminNav tab="products" />
      <AdminWelcome
        tab="products"
        metrics={[
          { label: "محصول فعال", value: products.length, icon: "✿" },
          { label: "تنوع کالا", value: products.reduce((count, product) => count + product.variants.length, 0), icon: "◈" },
          { label: "نیازمند موجودی", value: products.filter(p => p.stock <= 3).length, icon: "◷" },
          { label: "تصاویر محصولات", value: products.reduce((count, p) => count + p.images.length, 0), icon: "▧" },
        ]}
      />
      <AdminProducts initial={products} />
    </div>
  );
}

type AdminMetric = { label: string; value: number; icon: string };

function AdminArtwork() {
  return (
    <div className="admin-artwork" aria-hidden="true">
      <Image
        src="/images/noghlijan-hero-high-quality.webp"
        alt=""
        width={1536}
        height={1536}
        className="admin-artwork-img admin-artwork-img--light"
        sizes="(max-width: 768px) 85vw, 450px"
        priority={false}
      />
      <Image
        src="/images/noghlijan-hero-dark-8k.webp"
        alt=""
        width={8192}
        height={8192}
        className="admin-artwork-img admin-artwork-img--dark"
        sizes="(max-width: 768px) 85vw, 450px"
      />
    </div>
  );
}

function AdminWelcome({ tab, metrics }: { tab: "products" | "orders" | "content" | "payments"; metrics: AdminMetric[] }) {
  const productsTab = tab === "products";
  const contentTab = tab === "content";
  const paymentsTab = tab === "payments";
  return (
    <>
      <section className="admin-welcome" aria-labelledby="admin-welcome-title">
        <div className="admin-welcome-copy">
          <p className="admin-eyebrow">✳ NOGHLIJAN · CREATIVE STUDIO</p>
          <h1 id="admin-welcome-title" className="admin-welcome-title">
            {paymentsTab ? <>پرداختی امن و <span>راحت.</span></> : contentTab ? <>داستان نقلی‌جان رو <span>تعریف کن.</span></> : productsTab ? <>ویترین قشنگ‌تری <span>بسازیم.</span></> : <>سفارش‌ها رو با <span>عشق</span> مدیریت کنیم.</>}
          </h1>
          <p className="admin-welcome-subtitle">
            {paymentsTab
              ? "وضعیت زرین‌پال، آقای پرداخت، بله‌پی و پرداخت رمزارزی را ببین و تنظیمات اتصال را بررسی کن."
              : contentTab
              ? "متن‌های دربارهٔ ما، تماس، مسیریاب‌ها، شبکه‌های اجتماعی و شرایط فروشگاه را از یک جا مدیریت کن."
              : productsTab
              ? "محصولات، عکس‌ها، رنگ‌ها و سایزها، همه در یک فضای مرتب و دوست‌داشتنی."
              : "جزئیات خرید، وضعیت سفارش و آماده‌سازی ارسال‌ها در یک نگاه."}
          </p>
          <div className="admin-welcome-actions">
            <a className="admin-primary-link" href={paymentsTab ? "#admin-payment-methods" : contentTab ? "#site-content-editor" : productsTab ? "#admin-product-editor" : "#admin-order-list"}>
              {paymentsTab ? "مشاهدهٔ درگاه‌ها" : contentTab ? "ویرایش محتوای صفحه‌ها" : productsTab ? "افزودن یا ویرایش محصول" : "مشاهدهٔ سفارش‌ها"} <span aria-hidden="true">←</span>
            </a>
            <Link className="admin-secondary-link" href="/">
              دیدن ویترین فروشگاه <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <AdminArtwork />
        <span className="admin-welcome-decoration" aria-hidden="true">✿</span>
      </section>
      <dl className="admin-stats" aria-label="خلاصهٔ مدیریت فروشگاه">
        {metrics.map((metric, index) => (
          <div className={"admin-stat admin-stat--" + (index + 1)} key={metric.label}>
            <dt><span className="admin-stat-icon" aria-hidden="true">{metric.icon}</span>{metric.label}</dt>
            <dd>{metric.value.toLocaleString("fa-IR")}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
