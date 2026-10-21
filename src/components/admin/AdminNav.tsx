"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandWordmark } from "@/components/BrandWordmark";

export function AdminNav({ tab }: { tab: "products" | "orders" | "content" }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"logout" | "store" | null>(null);
  const [error, setError] = useState("");

  async function endAdminSession(action: "logout" | "store") {
    setPendingAction(action);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) throw Error("Admin logout failed");
      if (action === "store") router.replace("/shop");
      else router.refresh();
    } catch {
      setError("خروج از مدیریت انجام نشد؛ لطفاً دوباره تلاش کنید.");
      setPendingAction(null);
    }
  }

  return (
    <header className="admin-navbar">
      <div className="admin-nav-brand">
        <Link href="/admin?tab=products" className="admin-nav-logo" aria-label="خانه پنل مدیریت نقلی‌جان">
          <BrandWordmark className="brand-wordmark--admin" />
          <span className="admin-brand-caption">استودیوی مدیریت فروشگاه</span>
        </Link>
        <span className="admin-nav-studio-label" aria-hidden="true">CREATIVE STUDIO</span>
      </div>

      <div className="admin-nav-controls">
        <nav className="admin-tabs" aria-label="بخش‌های پنل مدیریت">
          <Link href="/admin?tab=products" aria-current={tab === "products" ? "page" : undefined}
            className={"admin-tab " + (tab === "products" ? "is-active" : "")}>
            <span aria-hidden="true">▧</span> محصولات
          </Link>
          <Link href="/admin?tab=orders" aria-current={tab === "orders" ? "page" : undefined}
            className={"admin-tab " + (tab === "orders" ? "is-active" : "")}>
            <span aria-hidden="true">◫</span> سفارش‌ها
          </Link>
          <Link href="/admin?tab=content" aria-current={tab === "content" ? "page" : undefined}
            className={"admin-tab " + (tab === "content" ? "is-active" : "")}>
            <span aria-hidden="true">✎</span> محتوای سایت
          </Link>
        </nav>
        <div className="admin-nav-actions">
          <ThemeToggle className="admin-theme-toggle" />
          <button type="button" onClick={() => void endAdminSession("store")}
            disabled={pendingAction !== null}
            className="admin-nav-store" title="خروج از مدیریت و رفتن به فروشگاه">
            <span aria-hidden="true">↗</span>
            <span>{pendingAction === "store" ? "در حال انتقال..." : "فروشگاه"}</span>
          </button>
          <button type="button" onClick={() => void endAdminSession("logout")}
            disabled={pendingAction !== null}
            className="admin-nav-logout" title="خروج از پنل مدیریت">
            <span aria-hidden="true">⇥</span>
            <span>{pendingAction === "logout" ? "در حال خروج..." : "خروج"}</span>
          </button>
        </div>
      </div>
      {error && <p role="alert" className="admin-nav-error">{error}</p>}
    </header>
  );
}
