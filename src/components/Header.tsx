"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerAvatarMenu } from "@/components/CustomerAvatarMenu";
import { BrandWordmark } from "@/components/BrandWordmark";

const links = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount, bump } = useCart();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className={`glass-header relative z-20 border-b border-[#ddab9a]/20 ${pathname === "/" ? "home-header" : ""}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="brand-header-link group flex shrink-0 items-center gap-2" aria-label="صفحه اصلی نقلی‌جان">
          <BrandWordmark className="brand-wordmark--header" priority />
          <span className="brand-header-tagline text-ink-soft">پوشاک بچه‌گانه</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="order-3 flex w-full items-center justify-center gap-2 whitespace-nowrap border-t border-[#d8a89a]/15 pt-3 sm:order-none sm:w-auto sm:gap-3 sm:border-0 sm:pt-0">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${active ? "bg-[#ffe0e3] text-[#7f3751] dark:bg-[#6c4354] dark:text-white" : "text-ink-soft hover:bg-cream-deep hover:text-ink"}`}>
                {label}
              </Link>
            );
          })}
          <Link
            href="/cart"
            aria-current={pathname === "/cart" ? "page" : undefined}
            aria-label={itemCount > 0 ? `سبد خرید، ${itemCount.toLocaleString("fa-IR")} کالا` : "سبد خرید"}
            title="سبد خرید"
            className={`brand-cart-link ${pathname === "/cart" ? "is-active" : ""}`}
          >
            <svg aria-hidden="true" viewBox="0 0 28 28" fill="none" className="brand-cart-icon">
              <path d="M2.7 5.1h2.65l2.04 9.84a2.2 2.2 0 0 0 2.15 1.76h9.32a2.2 2.2 0 0 0 2.09-1.5l2.12-6.61H6.06"
                stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.3 11.65c.55-1.03 1.7-.99 2.25-.07.57-.93 1.72-.97 2.28-.01.65 1.18-1.02 2.39-2.28 3.22-1.29-.83-2.91-2.03-2.25-3.14Z"
                fill="currentColor" />
              <circle cx="10.1" cy="21.22" r="1.5" fill="currentColor" />
              <circle cx="19.5" cy="21.22" r="1.5" fill="currentColor" />
            </svg>
            {itemCount > 0 && (
              <span aria-hidden="true" className={`brand-cart-count ${bump ? "bump" : ""}`}>
                {itemCount > 99 ? "۹۹+" : itemCount.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CustomerAvatarMenu />
          <form action="/shop" method="get" role="search" className="glass-input hidden items-center rounded-full focus-within:ring-2 focus-within:ring-teal/30 lg:flex">
            <label htmlFor="site-search" className="sr-only">جستجو در محصولات</label>
            <input id="site-search" name="q" type="search" maxLength={80} placeholder="دنبال چی می‌گردی؟" className="w-40 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/75 xl:w-52" />
            <button type="submit" aria-label="جستجو" className="m-1 grid size-9 place-items-center rounded-full bg-teal text-white hover:bg-[#913b55]">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </button>
          </form>
        </div>
        <form action="/shop" method="get" role="search" className="glass-input order-4 flex w-full items-center rounded-full focus-within:ring-2 focus-within:ring-teal/30 lg:hidden">
          <label htmlFor="mobile-site-search" className="sr-only">جستجو در محصولات</label>
          <input id="mobile-site-search" name="q" type="search" maxLength={80} placeholder="جستجو بین لباس‌ها..." className="w-full min-w-0 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/75" />
          <button type="submit" aria-label="جستجو" className="m-1 grid size-9 shrink-0 place-items-center rounded-full bg-teal text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          </button>
        </form>
      </div>
    </header>
  );
}
