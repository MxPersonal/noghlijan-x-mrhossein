"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.get("password") }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "رمز عبور معتبر نیست؛ دوباره امتحان کنید.");
        return;
      }
      router.refresh();
    } catch {
      setError("اتصال به سرور برقرار نشد؛ لطفاً مجدداً تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-login-form glass-surface">
      <div className="admin-login-topline">
        <span className="admin-login-lock" aria-hidden="true">✦</span>
        <ThemeToggle className="admin-theme-toggle" />
      </div>
      <span className="admin-login-kicker">ورود امن به پنل</span>
      <h2 className="admin-login-heading">خوش اومدی <span>به نقلی‌جان!</span></h2>
      <p className="admin-login-description">
        برای مدیریت محصولات، تصاویر، موجودی و سفارش‌ها وارد حساب مدیریت شو.
      </p>
      <label htmlFor="admin-password" className="admin-login-label">رمز عبور مدیریت</label>
      <div className="admin-password-wrap">
        <input
          id="admin-password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="رمز عبور خود را وارد کنید"
          className="admin-password-input"
          aria-invalid={!!error}
          aria-describedby={error ? "admin-login-error" : undefined}
        />
        <button type="button" className="admin-password-toggle"
          onClick={() => setShowPassword(visible => !visible)}
          aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
          aria-pressed={showPassword}
        >{showPassword ? "پنهان" : "نمایش"}</button>
      </div>
      {error && <p id="admin-login-error" role="alert" className="admin-login-error">{error}</p>}
      <button type="submit" disabled={loading} className="admin-login-submit">
        {loading ? "در حال ورود..." : "ورود به استودیو"} <span aria-hidden="true">←</span>
      </button>
      <Link href="/" className="admin-login-back">بازگشت به فروشگاه <span aria-hidden="true">↗</span></Link>
      <p className="admin-login-footnote">این بخش ویژهٔ مدیران فروشگاه نقلی‌جان است.</p>
    </form>
  );
}
