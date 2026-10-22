"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart";
import { formatPrice } from "@/lib/format";
import type { MethodOption, PaymentMethod } from "@/lib/payment-providers";

type Customer = { fullName:string; mobile:string; address:string|null; postalCode:string|null; phoneVerified:boolean };

export function CustomerCheckout({ customer, methods }: { customer: Customer; methods: MethodOption[] }) {
  const { items, total } = useCart();
  const router=useRouter();
  const [address,setAddress]=useState(customer.address ?? "");
  const [postalCode,setPostalCode]=useState(customer.postalCode ?? "");
  const [other,setOther]=useState(false);
  const [recipientName,setRecipientName]=useState("");
  const [recipientPhone,setRecipientPhone]=useState("");
  const [saveAddress,setSaveAddress]=useState(true);
  const [loading,setLoading]=useState(false);
  const [paymentMethod,setPaymentMethod]=useState<PaymentMethod>(methods.find(m => m.available)?.id ?? "zarinpal");
  const canPay = methods.some(m => m.id === paymentMethod && m.available);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");setLoading(true);
    try {
      const res=await fetch("/api/checkout", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          address,postalCode,recipientIsOther:other,
          recipientName:other?recipientName:undefined,
          recipientPhone:other?recipientPhone:undefined,
          saveAddress, paymentMethod,
          items:items.map(i=>({productId:i.productId,variantId:i.variantId,quantity:i.quantity})),
        }),
      });
      const data=await res.json() as {error?:string;paymentUrl?:string;orderId?:string;demo?:boolean};
      if (!res.ok) throw Error(data.error || "ثبت سفارش ناموفق بود");
      if (data.paymentUrl && data.orderId) {
        sessionStorage.setItem("noghlijan_pending_checkout", JSON.stringify({
          orderId: data.orderId,
          lines: items.map(item => ({ productId: item.productId,
            variantId: item.variantId, quantity: item.quantity })),
        }));
        // Keep the cart until payment has been confirmed by the gateway.
        // A cancelled payment must not silently lose customer selections.
        window.location.assign(data.paymentUrl);
        return;
      }
      throw Error("پاسخ نامعتبر از سرور");
    } catch(e) {setError(e instanceof Error?e.message:"خطا در اتصال");setLoading(false);}
  }

  if (!items.length) return <div className="customer-empty-checkout mx-auto max-w-3xl px-4 py-24 text-center">
    <span aria-hidden="true">✿</span><h1>سبدت هنوز خالیه!</h1><p>اول لباس‌های قشنگ رو انتخاب کن.</p>
    <Link href="/shop">گشت‌وگذار در فروشگاه ←</Link>
  </div>;

  return (
    <div className="customer-checkout-page mx-auto max-w-6xl px-4 py-11 sm:px-6">
      <div className="customer-checkout-heading">
        <p className="customer-eyebrow">✳ SECURE CHECKOUT</p>
        <h1>تسویه‌حساب <span>نقلی‌جان</span></h1>
        <p>اطلاعات ارسال را کامل کن تا سفارش بدون اشتباه به دست گیرنده برسد.</p>
      </div>
      <div className="customer-checkout-grid">
        <form onSubmit={submit} className="customer-panel customer-shipping-form">
          <h2>اطلاعات تحویل سفارش</h2>
          <p className="customer-hint">اطلاعات حساب شما فقط برای سفارش مربوط به خودتان استفاده می‌شود.</p>
          <div className="customer-shipping-fixed">
            <span>خریدار: <strong>{customer.fullName}</strong></span>
            <span>موبایل: <strong dir="ltr">{customer.mobile}</strong></span>
          </div>
          <label>کد پستی *
            <input required inputMode="numeric" minLength={10} maxLength={10} value={postalCode}
              onChange={e=>setPostalCode(e.target.value)} placeholder="۱۰ رقم کد پستی" dir="ltr" />
          </label>
          <label>آدرس کامل *
            <textarea required minLength={12} maxLength={700} rows={5}
              value={address} onChange={e=>setAddress(e.target.value)}
              placeholder="استان، شهر، خیابان، کوچه، پلاک، طبقه و واحد" />
          </label>
          <label className="customer-check-choice">
            <input type="checkbox" checked={saveAddress} onChange={e=>setSaveAddress(e.target.checked)} />
            این آدرس و کد پستی در حسابم ذخیره شود.
          </label>
          <div className="customer-recipient-group">
            <label className="customer-check-choice customer-recipient-switch">
              <input type="checkbox" checked={other} onChange={e=>setOther(e.target.checked)} />
              تحویل‌گیرنده شخص دیگری است
            </label>
            {other && <div className="customer-recipient-inputs">
              <label>نام و نام خانوادگی تحویل‌گیرنده *
                <input required minLength={3} maxLength={120} autoComplete="off"
                  value={recipientName} onChange={e=>setRecipientName(e.target.value)}
                  placeholder="نام گیرنده" />
              </label>
              <label>شماره تماس تحویل‌گیرنده *
                <input required type="tel" inputMode="tel" autoComplete="off" dir="ltr"
                  value={recipientPhone} onChange={e=>setRecipientPhone(e.target.value)}
                  placeholder="09xxxxxxxxx" />
              </label>
            </div>}
          </div>
          <fieldset className="customer-payment-methods">
            <legend>انتخاب روش پرداخت</legend>
            <p className="customer-hint">روش پرداخت دلخواهت را انتخاب کن. تنها درگاه‌های آماده برای پرداخت فعال هستند.</p>
            <div className="customer-payment-list">
              {methods.map(method => (
                <label key={method.id}
                  className={"customer-payment-option" + (paymentMethod === method.id && method.available ? " is-selected" : "") +
                    (!method.available ? " is-unavailable" : "")}>
                  <input type="radio" name="payment-method" value={method.id} disabled={!method.available}
                    checked={paymentMethod === method.id && method.available}
                    onChange={() => setPaymentMethod(method.id)} />
                  <span aria-hidden="true" className="customer-payment-glyph">
                    {method.id === "zarinpal" ? "✦" : method.id === "aqayepardakht" ? "◈" :
                      method.id === "balepay" ? "♡" : "₿"}
                  </span>
                  <span className="customer-payment-labels">
                    <strong>{method.title}</strong>
                    <small>{method.description}</small>
                  </span>
                  <span className={"customer-payment-state" + (!method.available ? " disabled" : "")}>
                    {method.available ? "آمادهٔ پرداخت" : "در انتظار فعال‌سازی"}
                  </span>
                </label>
              ))}
            </div>
            {methods.every(m => !m.available) && (
              <p role="status" className="customer-auth-notice">درگاه‌های پرداخت فروشگاه هنوز تنظیم نشده‌اند. سفارش بدون دریافت پرداخت نهایی نمی‌شود.</p>
            )}
          </fieldset>
          {!customer.phoneVerified && <p className="customer-auth-notice">
            شمارهٔ موبایل حساب هنوز از طریق پیامک تأیید نشده است.
          </p>}
          {error && <p role="alert" className="customer-error">{error}</p>}
          <button disabled={loading || !canPay} type="submit" className="customer-primary-button">
            {loading?"در حال ثبت...":"تأیید آدرس و ادامهٔ پرداخت"} <span aria-hidden="true">←</span>
          </button>
        </form>
        <aside className="customer-panel customer-checkout-summary">
          <p className="customer-eyebrow">YOUR LITTLE BAG</p>
          <h2>خلاصهٔ سبد خرید</h2>
          <ul>{items.map((item,i)=><li key={item.productId+":"+(item.variantId??"")+i}>
            <div><strong>{item.name}</strong>{item.variantLabel && <small>{item.variantLabel}</small>}
              <span>تعداد: {item.quantity.toLocaleString("fa-IR")}</span></div>
            <b>{formatPrice(item.price*item.quantity)}</b>
          </li>)}</ul>
          <div className="customer-order-total"><span>جمع کل</span><strong>{formatPrice(total)}</strong></div>
          <Link href="/cart">ویرایش سبد خرید ←</Link>
        </aside>
      </div>
    </div>
  );
}
