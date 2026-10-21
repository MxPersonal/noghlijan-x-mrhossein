"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/cart", label: "سبد خرید" },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount, bump } = useCart();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="glass-header relative z-20 border-b border-[#ddab9a]/20">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="صفحه اصلی نقلی‌جان">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-[#f9d6d8] text-2xl shadow-sm sm:size-12">🌼</span>
          <span>
            <span className="block font-display text-3xl leading-none text-teal-deep sm:text-4xl">نقلی‌جان</span>
            <span className="mt-1 block text-[11px] text-ink-soft">پوشاک بچه‌گانه</span>
          </span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="order-3 flex w-full items-center justify-center gap-1 border-t border-[#d8a89a]/15 pt-3 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4 ${active ? "bg-[#ffe0e3] text-[#7f3751] dark:bg-[#6c4354] dark:text-white" : "text-ink-soft hover:bg-cream-deep hover:text-ink"}`}>
                {label}
                {href === "/cart" && itemCount > 0 && <span aria-label={`${itemCount} کالا`} className={`cart-badge mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal px-1.5 text-[11px] text-white ${bump ? "bump" : ""}`}>{itemCount.toLocaleString("fa-IR")}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
