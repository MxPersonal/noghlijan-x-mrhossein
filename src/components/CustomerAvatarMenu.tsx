"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type User = { id:string; fullName:string; mobile:string; avatarUrl:string|null; phoneVerified:boolean };

export function CustomerAvatarMenu() {
  const [user, setUser] = useState<User|null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    function refresh() {
      fetch("/api/customer/me", { cache: "no-store" }).then(async res => {
        const data = res.ok ? await res.json() as { customer:User } : null;
        if (mounted) { setUser(data?.customer ?? null); setChecking(false); }
      }).catch(() => { if (mounted) { setUser(null); setChecking(false); } });
    }
    refresh();
    window.addEventListener("customer-session-changed", refresh);
    return () => { mounted = false; window.removeEventListener("customer-session-changed", refresh); };
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);

  async function logout() {
    setBusy(true);
    try {
      const res = await fetch("/api/customer/logout", { method: "POST" });
      if (!res.ok) throw Error("failed");
      setUser(null);
      setOpen(false);
      window.dispatchEvent(new Event("customer-session-changed"));
      window.dispatchEvent(new Event("customer-signed-out"));
      router.push("/");
      router.refresh();
    } catch { alert("خروج از حساب انجام نشد. دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  return (
    <div ref={root} className="customer-menu-root">
      <button type="button" aria-label={user ? "منوی حساب کاربری " + user.fullName : "ورود یا ثبت‌نام"}
        title={user ? "حساب کاربری" : "ورود و ثبت‌نام"}
        aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(current => !current)}
        className={"customer-avatar-button" + (open ? " is-open" : "")}>
        {user?.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" fill sizes="44px"
            className="customer-avatar-image" unoptimized />
        ) : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="customer-avatar-placeholder">
          <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M4.5 20.1c.4-4.2 3.1-6.2 7.5-6.2s7.1 2 7.5 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>}
        <span aria-hidden="true" className="customer-menu-mark">≡</span>
      </button>
      {open && (
        <div className="customer-menu-popover" role="menu" aria-label="میان‌برهای حساب کاربری">
          <div className="customer-menu-hello">
            <span aria-hidden="true">✿</span>
            <div>
              <strong>{checking ? "در حال بررسی حساب..." : user ? user.fullName : "مهمان عزیز سلام ، خوش اومدی !"}</strong>
              <small>{checking ? "کمی صبر کنید" : user ? (user.phoneVerified ? user.mobile : "شماره موبایل تأیید نشده") : "ورود/ثبت نام"}</small>
            </div>
          </div>
          <div className="customer-menu-items">
            {!checking && (user ? (
              <>
                <Link role="menuitem" href="/account"><span>◉</span> اطلاعات حساب کاربری</Link>
                <Link role="menuitem" href="/cart"><span>▤</span> سبد خرید</Link>
                <Link role="menuitem" href="/checkout"><span>♡</span> تسویه‌حساب</Link>
                <button role="menuitem" type="button" disabled={busy} onClick={() => void logout()}>
                  <span>↩</span> {busy ? "در حال خروج..." : "خروج از حساب کاربری"}
                </button>
              </>
            ) : (
              <Link role="menuitem" href="/login"><span>↗</span> ورود / ثبت‌نام</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
