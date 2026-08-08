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
    <header className="glass-header relative z-20 border-b border-white/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group">
          <span className="font-display text-2xl tracking-wide text-teal sm:text-3xl">
            کلوث استور
          </span>
          <span className="mt-0.5 block text-xs text-ink-soft transition group-hover:text-teal">
            لباس بچه‌گانه
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-mint text-teal-deep"
                    : "text-ink-soft hover:bg-cream-deep hover:text-ink"
                }`}
              >
                {link.label}
                {link.href === "/cart" && itemCount > 0 ? (
                  <span
                    className={`cart-badge mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-peach px-1.5 text-[11px] font-medium text-white ${
                      bump ? "bump" : ""
                    }`}
                  >
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <ThemeToggle className="mr-1" />
        </nav>

        <form
          action="/shop"
          method="get"
          role="search"
          className="glass-input order-3 flex w-full items-center rounded-xl transition focus-within:border-teal/35 focus-within:ring-2 focus-within:ring-teal/30 lg:order-none lg:w-72"
        >
          <label htmlFor="site-search" className="sr-only">
            جستجو در محصولات و دسته‌ها
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            maxLength={80}
            placeholder="جستجوی محصول یا دسته..."
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/70"
          />
          <button
            type="submit"
            aria-label="جستجو"
            className="m-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal text-white transition hover:bg-teal-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
