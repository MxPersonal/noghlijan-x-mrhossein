import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

// The new reference artwork will replace this Cloudinary asset once uploaded.
// Keeping the image URL centralized makes future swaps a one-line Git commit.
const HERO_IMAGE = "https://res.cloudinary.com/xpersonalx/image/upload/v1792601213/noghlijan/temporary-upload-check.png";

const benefits = [
  { label: "ضمانت مرجوعی", description: "خرید با خیال آسوده", icon: "↺", color: "bg-[#f58e9a] text-[#713744]" },
  { label: "تضمین کیفیت", description: "انتخابی لطیف برای کوچولوها", icon: "✓", color: "bg-[#f5c95e] text-[#72501d]" },
  { label: "خرید مطمئن", description: "شفاف و ساده", icon: "♡", color: "bg-[#80c3d8] text-[#245269]" },
  { label: "سبد خرید", description: "همیشه در دسترس", icon: "🛒", color: "bg-[#b3ca78] text-[#405126]" },
];

const categories = [
  { title: "دخترانه", description: "لباس‌های رنگی و گل‌گلی", href: "/shop?gender=دخترانه", emoji: "🎀", color: "bg-[#fbe1e5]" },
  { title: "پسرانه", description: "راحت و پر از شیطنت", href: "/shop?gender=پسرانه", emoji: "🧸", color: "bg-[#e0eef0]" },
  { title: "همهٔ لباس‌ها", description: "یک دنیا انتخاب دوست‌داشتنی", href: "/shop", emoji: "🌼", color: "bg-[#faedc4]" },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isActive: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { labels: { select: { name: true } } },
  });

  return (
    <div>
      <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-5 sm:pt-6" aria-labelledby="home-hero-title">
        <div className="pastel-hero relative overflow-hidden rounded-[2.5rem] px-5 py-9 sm:px-10 sm:py-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#f6b4a3]/25 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-72 rounded-full bg-[#a7c5a1]/20 blur-2xl" />
          <div className="relative z-10 max-w-xl">
            <p className="pastel-kicker inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
              <span aria-hidden="true">✿</span> دنیای رنگی کوچولوها
            </p>
            <h1 id="home-hero-title" className="mt-5 font-display text-6xl leading-[1.15] text-ink sm:text-7xl xl:text-8xl">
              نقلی‌جان
            </h1>
            <p className="mt-3 font-display text-3xl text-teal-deep sm:text-4xl">
              پوشاک بچه‌گانه
            </p>
            <p className="mt-5 max-w-md text-base leading-8 text-ink-soft sm:text-lg">
              لباس‌های شاد، لطیف و دوست‌داشتنی برای لحظه‌های شیرین کودکی.
              با چند کلیک، لباس محبوب کوچولوت رو پیدا کن.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#aa4863]/20 transition hover:-translate-y-0.5 hover:bg-[#913b55]">
                مشاهدهٔ محصولات <span aria-hidden="true" className="mr-2">←</span>
              </Link>
              <Link href="/shop?gender=دخترانه" className="glass-soft inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-ink transition hover:bg-cream-deep">
                خرید دخترانه
              </Link>
              <Link href="/shop?gender=پسرانه" className="glass-soft inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-ink transition hover:bg-cream-deep">
                خرید پسرانه
              </Link>
            </div>
          </div>
          <div className="relative z-10 mx-auto mt-10 w-full max-w-[36rem] lg:mt-0">
            <div className="pastel-hero-image relative aspect-square overflow-hidden rounded-[2rem] border-[7px] border-white/70 bg-[#f7d4bc] sm:rounded-[2.7rem]">
              <Image
                src={HERO_IMAGE}
                alt="تصویر پوشاک کودک نقلی‌جان"
                fill
                priority
                className="object-contain object-center"
                sizes="(max-width: 1024px) 90vw, 46vw"
              />
            </div>
            <span aria-hidden="true" className="absolute -bottom-4 -right-2 grid size-14 place-items-center rounded-full bg-[#ffcf68] text-3xl shadow-lg sm:-right-5">🌼</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6" aria-label="مزایای خرید از نقلی‌جان">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {benefits.map(({ label, description, icon, color }) => (
            <div key={label} className="pastel-feature flex flex-col items-center rounded-[1.8rem] px-3 py-5 text-center sm:py-6">
              <span aria-hidden="true" className={`mb-3 grid size-14 place-items-center rounded-full text-3xl font-bold shadow-sm ${color}`}>{icon}</span>
              <h2 className="text-sm font-bold text-ink sm:text-base">{label}</h2>
              <p className="mt-1 text-xs leading-6 text-ink-soft">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="categories-title">
        <div className="mb-7">
          <p className="text-sm font-semibold text-teal-deep">از کجا شروع کنیم؟</p>
          <h2 id="categories-title" className="mt-1 font-display text-4xl text-ink">دسته‌بندی‌های دوست‌داشتنی</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map(({ title, description, href, emoji, color }) => (
            <Link key={href} href={href} className="pastel-category group flex items-center gap-4 rounded-[2rem] p-5 sm:flex-col sm:p-7 sm:text-center">
              <span aria-hidden="true" className={`grid size-20 shrink-0 place-items-center rounded-[1.7rem] text-4xl sm:size-24 ${color}`}>{emoji}</span>
              <div>
                <h3 className="font-display text-3xl text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-7 text-ink-soft">{description}</p>
                <span className="mt-2 inline-block text-sm font-semibold text-teal-deep group-hover:underline">مشاهدهٔ محصولات ←</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="new-products-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-deep">تازه رسیدن!</p>
            <h2 id="new-products-title" className="mt-1 font-display text-4xl text-ink">نقلی‌های تازه</h2>
            <p className="mt-2 text-sm text-ink-soft">جدیدترین انتخاب‌های خوش‌رنگ فروشگاه</p>
          </div>
          <Link href="/shop" className="rounded-full border border-teal/30 px-5 py-2.5 text-sm font-semibold text-teal-deep transition hover:bg-cream-deep">دیدن همهٔ محصولات ←</Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((product) => <ProductCard key={product.id} {...product} />)}
          </div>
        ) : (
          <div className="pastel-feature rounded-[2rem] p-10 text-center text-ink-soft">محصولات جدید به‌زودی اینجا نمایش داده می‌شوند.</div>
        )}
      </section>
    </div>
  );
}
