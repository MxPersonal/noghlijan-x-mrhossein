"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="glass-header relative z-10 mt-auto border-t border-white/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-xl text-teal">کلوث استور</p>
          <p className="mt-1 text-sm text-ink-soft">
            لباس نرم و شاد برای کوچولوها
          </p>
        </div>
        <div className="flex gap-4 text-sm text-ink-soft">
          <Link href="/shop" className="hover:text-teal">
            فروشگاه
          </Link>
          <Link href="/admin" className="hover:text-teal">
            پنل مدیریت
          </Link>
        </div>
      </div>
    </footer>
  );
}
