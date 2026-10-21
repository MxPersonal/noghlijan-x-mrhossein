"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function CustomerAccessForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(register ? "/api/customer/register" : "/api/customer/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: data.get("mobile"), password: data.get("password"),
          ...(register ? { fullName: data.get("fullName"), nationalId: data.get("nationalId"),
            email: data.get("email") } : {}),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw Error(result.error || "امکان ورود وجود ندارد");
      window.dispatchEvent(new Event("customer-session-changed"));
      router.push(nextPath);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "اتصال برقرار نشد");
    } finally { setBusy(false); }
  }

  return (
    <section className="customer-access-page mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="customer-access-layout">
        <div className="customer-access-intro">
          <p className="customer-eyebrow">✿ NOGHLIJAN · YOUR LITTLE WORLD</p>
          <h1>دنیای نقلی‌جان <span>منتظرته!</span></h1>
          <p>اطلاعات خریدت را یک‌بار ثبت کن، سفارشت را پیگیری کن و با آواتار دلخواهت به فروشگاه سر بزن.</p>
          <div className="customer-access-decor" aria-hidden="true">✿ <span>♡</span> ✦</div>
          <Link href="/shop">گشت‌وگذار در فروشگاه ←</Link>
        </div>
        <form onSubmit={onSubmit} className="customer-panel customer-access-form">
          <div className="customer-auth-tabs" role="group" aria-label="نوع ورود">
            <button type="button" aria-pressed={!register} className={!register ? "is-active" : ""}
              onClick={() => { setRegister(false); setError(""); }}>ورود</button>
            <button type="button" aria-pressed={register} className={register ? "is-active" : ""}
              onClick={() => { setRegister(true); setError(""); }}>ثبت‌نام</button>
          </div>
          <h2>{register ? "حساب کوچولوی خودت رو بساز" : "دوباره خوش اومدی!"}</h2>
          <p className="customer-hint">{register
            ? "کد ملی و موبایل الزامی هستند؛ ایمیل اختیاری است."
            : "با شماره موبایل و رمز عبور خودت وارد شو."}</p>
          {register && <>
            <label>نام و نام خانوادگی *
              <input name="fullName" required minLength={3} maxLength={120} autoComplete="name" placeholder="نام و نام خانوادگی" />
            </label>
            <label>کد ملی *
              <input name="nationalId" required inputMode="numeric" minLength={10} maxLength={10}
                autoComplete="off" placeholder="۱۰ رقم کد ملی" />
              <small>فقط اثرانگشت رمزنگاری‌شدهٔ کد ملی در سرور ذخیره می‌شود.</small>
            </label>
          </>}
          <label>شماره موبایل *
            <input name="mobile" type="tel" required inputMode="tel" autoComplete="tel"
              placeholder="09xxxxxxxxx" dir="ltr" />
          </label>
          {register && <label>ایمیل (اختیاری)
            <input name="email" type="email" maxLength={160} autoComplete="email" placeholder="example@email.com" dir="ltr" />
          </label>}
          <label>رمز عبور *
            <span className="customer-password-wrap">
              <input name="password" required type={showPassword ? "text" : "password"}
                minLength={register ? 10 : undefined} maxLength={128}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={register ? "حداقل ۱۰ نویسه" : "رمز عبور"} />
              <button type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "پنهان" : "نمایش"}</button>
            </span>
          </label>
          {register && <p className="customer-auth-notice">توجه: ورود با رمز عبور انجام می‌شود. تأیید مالکیت شماره موبایل با پیامک هنوز فعال نشده است.</p>}
          {error && <p role="alert" className="customer-error">{error}</p>}
          <button type="submit" disabled={busy} className="customer-primary-button">
            {busy ? "در حال بررسی..." : register ? "ساخت حساب" : "ورود به حساب"} <span aria-hidden="true">←</span>
          </button>
        </form>
      </div>
    </section>
  );
}
