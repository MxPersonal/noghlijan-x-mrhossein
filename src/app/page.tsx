import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

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
      <section className="hero-stage relative mx-3 mt-3 min-h-[calc(100vh-7rem)] overflow-hidden rounded-[2rem] sm:mx-5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[56%] w-[92%] -translate-x-1/2 md:left-[3%] md:h-[94%] md:w-[52%] md:translate-x-0">
            <Image
              src="/images/hero-kids-transparent.png"
              alt=""
              fill
              priority
              className="object-contain object-bottom"
              sizes="(max-width: 768px) 92vw, 52vw"
            />
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col justify-start px-4 py-6 sm:px-6 sm:py-10 md:justify-center md:py-16">
          <div className="glass-hero w-full max-w-xl rounded-[2rem] p-6 sm:p-8 md:p-10">
            <p className="animate-fade-up font-display text-5xl text-teal sm:text-7xl md:text-8xl">
              کلوث استور
            </p>
            <h1 className="animate-fade-up-delay mt-4 max-w-md text-xl font-medium text-ink sm:text-2xl">
              لباس نرم و شاد برای کوچولوها
            </h1>
            <p className="animate-fade-up-delay mt-3 max-w-sm text-ink-soft">
              مجموعه‌ای از پوشاک بچه‌گانه با پارچه‌های لطیف و رنگ‌های زنده.
            </p>
            <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-xl bg-teal px-6 py-3 text-sm font-medium text-white shadow-lg shadow-teal/15 transition hover:bg-teal-deep"
              >
                مشاهده فروشگاه
              </Link>
              <Link
                href="/shop?gender=دخترانه"
                className="glass-soft rounded-xl px-6 py-3 text-sm font-medium text-ink transition hover:bg-white/75"
              >
                لباس دخترانه
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-ink">تازه‌ها</h2>
            <p className="mt-1 text-sm text-ink-soft">
              چند نمونه از لباس‌های محبوب کلوث استور
            </p>
          </div>
          <Link href="/shop" className="text-sm text-teal hover:text-teal-deep">
            همه محصولات
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>
    </div>
  );
}
