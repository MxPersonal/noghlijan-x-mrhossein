"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminNav({ tab }: { tab: "products" | "orders" }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"logout" | "store" | null>(
    null,
  );
  const [error, setError] = useState("");

  async function logout() {
    await endAdminSession("logout");
  }

  async function enterStore() {
    await endAdminSession("store");
  }

  async function endAdminSession(action: "logout" | "store") {
    setPendingAction(action);
    setError("");

    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Admin logout failed");
      }

      if (action === "store") {
        router.replace("/shop");
      } else {
        router.refresh();
      }
    } catch {
      setError("خروج از حالت مدیریت انجام نشد؛ لطفاً دوباره تلاش کنید.");
      setPendingAction(null);
    }
  }

  return (
    <div className="glass-soft mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
      <div>
        <Link href="/" className="font-display text-2xl text-teal">
          کلوث استور
        </Link>
        <p className="text-sm text-ink-soft">پنل مدیریت</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ThemeToggle />
        <Link
          href="/admin?tab=products"
          className={`rounded-lg px-3 py-2 text-sm ${
            tab === "products" ? "bg-teal text-white" : "bg-cream-deep text-ink"
          }`}
        >
          محصولات
        </Link>
        <Link
          href="/admin?tab=orders"
          className={`rounded-lg px-3 py-2 text-sm ${
            tab === "orders" ? "bg-teal text-white" : "bg-cream-deep text-ink"
          }`}
        >
          سفارش‌ها
        </Link>
        <button
          type="button"
          onClick={enterStore}
          disabled={pendingAction !== null}
          className="rounded-lg bg-mint px-3 py-2 text-sm font-medium text-teal-deep transition hover:bg-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "store" ? "در حال انتقال..." : "ورود به فروشگاه"}
        </button>
        <button
          type="button"
          onClick={logout}
          disabled={pendingAction !== null}
          className="rounded-lg px-3 py-2 text-sm text-peach hover:bg-peach/10"
        >
          {pendingAction === "logout" ? "در حال خروج..." : "خروج"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="w-full text-sm text-peach">
          {error}
        </p>
      ) : null}
    </div>
  );
}
