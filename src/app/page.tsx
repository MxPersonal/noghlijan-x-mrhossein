import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { HomeScrollExperience } from "@/components/HomeScrollExperience";

// Each theme has its own local artwork; theme-init.js sets data-theme before paint.
const HERO_IMAGE_LIGHT = "/images/noghlijan-hero-high-quality.webp";
const HERO_IMAGE_DARK = "/images/noghlijan-hero-dark-8k.webp";

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
    <div className="home-fullpage">
      <HomeScrollExperience />
      <section data-home-panel className="home-scene home-panel relative isolate overflow-hidden" aria-labelledby="home-hero-title">
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-10 pt-2 sm:px-6 lg:min-h-0 lg:flex-row lg:items-center lg:gap-3 lg:pb-12 lg:pt-3">
          <div data-home-reveal className="relative z-10 order-2 mx-auto max-w-lg py-5 text-center lg:order-1 lg:mx-0 lg:w-[43%] lg:shrink-0 lg:py-10 lg:pr-7 lg:text-right">
            <p className="home-kicker inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
              <span aria-hidden="true">✿</span> قصهٔ رنگی کوچولوها
            </p>
            <h1 id="home-hero-title" className="home-hero-heading mt-6 font-display text-5xl leading-[1.35] sm:text-6xl xl:text-7xl">
              لباس‌های خوش‌رنگ
              <span className="home-hero-accent block">برای روزهای شیرین</span>
            </h1>
            <p className="home-hero-description mx-auto mt-5 max-w-md text-base leading-9 lg:mx-0">
              از نقلی‌جان تا خونهٔ شما؛ پوشاک بچه‌گانهٔ نرم، راحت و رنگارنگ برای هر لحظهٔ کودکی.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#9a405d] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(145,67,89,0.18)] transition hover:bg-[#7c3148]">
                مشاهدهٔ محصولات <span aria-hidden="true" className="mr-2">←</span>
              </Link>
              <Link href="/shop?gender=دخترانه" className="home-secondary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition">
                خرید دخترانه
              </Link>
              <Link href="/shop?gender=پسرانه" className="home-secondary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition">
                خرید پسرانه
              </Link>
            </div>
          </div>
          <div data-home-reveal className="relative order-1 mx-auto w-full max-w-[660px] lg:order-2 lg:-mr-12 lg:w-[61%] lg:max-w-none lg:shrink-0">
            <Image
              src={HERO_IMAGE_LIGHT}
              alt="پوشاک بچه‌گانه نقلی‌جان؛ دختر و پسربچه در صحنه‌ای شاد و پاستلی"
              width={1536}
              height={1536}
              priority
              className="home-artwork home-artwork--light h-auto w-full"
              sizes="(max-width: 1024px) 100vw, (max-width: 1440px) 61vw, 840px"
            />
            <Image
              src={HERO_IMAGE_DARK}
              alt="پوشاک بچه‌گانه نقلی‌جان؛ دختر و پسربچه در صحنهٔ شب با رنگ‌های تیره"
              width={8192}
              height={8192}
              loading="lazy"
              className="home-artwork home-artwork--dark h-auto w-full"
              sizes="(max-width: 1024px) 100vw, (max-width: 1440px) 61vw, 840px"
            />
          </div>
        </div>
      </section>

      <section data-home-panel className="home-panel mx-auto w-full max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="categories-title">
        <div data-home-reveal className="mb-7">
          <p className="text-sm font-semibold text-teal-deep">از کجا شروع کنیم؟</p>
          <h2 id="categories-title" className="mt-1 font-display text-4xl text-ink">دسته‌بندی‌های دوست‌داشتنی</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map(({ title, description, href, emoji, color }) => (
            <Link key={href} href={href} data-home-reveal className="pastel-category group flex items-center gap-4 rounded-[2rem] p-5 sm:flex-col sm:p-7 sm:text-center">
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

      <section data-home-panel className="home-panel mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6" aria-labelledby="new-products-title">
        <div data-home-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-deep">تازه رسیدن!</p>
            <h2 id="new-products-title" className="mt-1 font-display text-4xl text-ink">نقلی‌های تازه</h2>
            <p className="mt-2 text-sm text-ink-soft">جدیدترین انتخاب‌های خوش‌رنگ فروشگاه</p>
          </div>
          <Link href="/shop" className="rounded-full border border-teal/30 px-5 py-2.5 text-sm font-semibold text-teal-deep transition hover:bg-cream-deep">دیدن همهٔ محصولات ←</Link>
        </div>
        {featured.length > 0 ? (
          <div data-home-reveal className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((product) => <ProductCard key={product.id} {...product} />)}
          </div>
        ) : (
          <div data-home-reveal className="pastel-feature rounded-[2rem] p-10 text-center text-ink-soft">محصولات جدید به‌زودی اینجا نمایش داده می‌شوند.</div>
        )}
      </section>
    </div>
  );
}
