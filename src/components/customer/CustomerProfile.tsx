"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, type FormEvent, type ChangeEvent } from "react";

export type CustomerView = {
  id:string; fullName:string; mobile:string; nationalIdMasked:string; email:string|null;
  postalCode:string|null; address:string|null; avatarUrl:string|null; phoneVerified:boolean;
};

export function CustomerProfile({ initial }: { initial: CustomerView }) {
  const [user,setUser] = useState(initial);
  const [fullName,setName] = useState(user.fullName);
  const [email,setEmail] = useState(user.email ?? "");
  const [postalCode,setPostal] = useState(user.postalCode ?? "");
  const [address,setAddress] = useState(user.address ?? "");
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState("");
  const [error,setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const notify = () => window.dispatchEvent(new Event("customer-session-changed"));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setStatus("");setError("");
    try {
      const response=await fetch("/api/customer/me",{method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({fullName,email,postalCode,address})});
      const data=await response.json() as {customer?:CustomerView;error?:string};
      if (!response.ok || !data.customer) throw Error(data.error ?? "ذخیره نشد");
      setUser(data.customer);setStatus("اطلاعات حساب با موفقیت ذخیره شد.");notify();
    }catch(e){setError(e instanceof Error?e.message:"خطا در ذخیره");}
    finally{setBusy(false);}
  }

  async function upload(event:ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];if(!file)return;
    setBusy(true);setStatus("");setError("");
    try {
      const form=new FormData();form.append("file",file);
      const response=await fetch("/api/customer/avatar",{method:"POST",body:form});
      const result=await response.json() as {customer?:CustomerView;error?:string};
      if(!response.ok||!result.customer)throw Error(result.error??"عکس آپلود نشد");
      setUser(result.customer);setStatus("تصویر پروفایل به‌روز شد.");notify();
    }catch(e){setError(e instanceof Error?e.message:"خطا در آپلود عکس");}
    finally{setBusy(false);if(input.current)input.current.value="";}
  }

  return (
    <section className="customer-panel customer-profile-card" aria-labelledby="profile-heading">
      <div className="customer-card-heading"><div><p className="customer-eyebrow">✳ YOUR PROFILE</p>
        <h2 id="profile-heading">اطلاعات حساب کاربری</h2></div>
        <Link href="/checkout">تسویه‌حساب ←</Link>
      </div>
      <div className="customer-profile-avatar-row">
        <div className="customer-large-avatar">{user.avatarUrl
          ? <Image src={user.avatarUrl} alt="تصویر پروفایل" fill sizes="90px" className="object-cover" unoptimized/>
          : <span aria-hidden="true">✿</span>}</div>
        <div><strong>تصویر پروفایل</strong><p>عکس مربعی با حجم حداکثر ۲ مگابایت</p>
          <label className="customer-avatar-upload">
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={upload} disabled={busy} className="sr-only" />انتخاب عکس جدید
          </label>
        </div>
      </div>
      <form onSubmit={save} className="customer-profile-fields">
        <label>نام و نام خانوادگی *<input required minLength={3} maxLength={120} value={fullName} onChange={e=>setName(e.target.value)} /></label>
        <label>شماره موبایل *<input readOnly value={user.mobile} dir="ltr" aria-describedby="mobile-status"/></label>
        <p className="customer-field-help" id="mobile-status">
          {user.phoneVerified ? "شماره موبایل تأیید شده است." : "این شماره هنوز با کد پیامکی تأیید نشده است."}
        </p>
        <label>کد ملی *<input readOnly value={user.nationalIdMasked} dir="ltr" /></label>
        <label>ایمیل (اختیاری)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} dir="ltr" /></label>
        <label>کد پستی<input inputMode="numeric" maxLength={10} value={postalCode} onChange={e=>setPostal(e.target.value)} placeholder="۱۰ رقم"/></label>
        <label className="customer-field-wide">آدرس کامل<textarea value={address} rows={4} maxLength={700}
          onChange={e=>setAddress(e.target.value)} placeholder="استان، شهر، خیابان، پلاک و واحد" /></label>
        {error && <p role="alert" className="customer-error customer-field-wide">{error}</p>}
        {status && <p role="status" className="customer-success customer-field-wide">{status}</p>}
        <button className="customer-primary-button customer-field-wide" type="submit" disabled={busy}>
          {busy?"در حال ذخیره...":"ذخیرهٔ اطلاعات"} <span aria-hidden="true">←</span>
        </button>
      </form>
    </section>
  );
}
