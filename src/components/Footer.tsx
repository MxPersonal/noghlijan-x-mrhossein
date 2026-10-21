"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="glass-header relative z-10 mt-auto border-t border-[#ddab9a]/20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Link href="/" className="brand-footer-link" aria-label="نقلی‌جان، صفحهٔ اصلی">
            <BrandWordmark className="brand-wordmark--footer" />
            <span className="brand-footer-caption">پوشاک بچه‌گانه</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-7 text-ink-soft">از رنگ‌های شیرین تا لباس‌های نرم؛ دنیایی از انتخاب‌های دوست‌داشتنی برای کوچولوها.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">دسترسی سریع</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-ink-soft">
            <Link href="/shop" className="hover:text-teal-deep">فروشگاه</Link>
            <Link href="/shop?gender=دخترانه" className="hover:text-teal-deep">پوشاک دخترانه</Link>
            <Link href="/shop?gender=پسرانه" className="hover:text-teal-deep">پوشاک پسرانه</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">دربارهٔ فروشگاه</h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-ink-soft">
            <Link href="/about" className="hover:text-teal-deep">دربارهٔ ما</Link>
            <Link href="/contact" className="hover:text-teal-deep">ارتباط با ما</Link>
            <Link href="/terms" className="hover:text-teal-deep">شرایط و قوانین</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">خرید آسان</h2>
          <p className="mt-4 text-sm leading-7 text-ink-soft">محصولات موردعلاقه‌ات رو انتخاب کن و از سبد خرید سفارش بده.</p>
          <Link href="/cart" className="mt-3 inline-block rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#913b55]">رفتن به سبد خرید ←</Link>
        </div>
      </div>
      <div className="border-t border-[#ddab9a]/20 px-4 py-4 text-center text-xs text-ink-soft">با عشق برای دنیای کوچولوها ✿</div>
    </footer>
  );
}
