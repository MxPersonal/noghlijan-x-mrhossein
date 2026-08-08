"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "ورود ناموفق");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-surface mx-auto mt-10 w-full max-w-sm space-y-4 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-teal">ورود ادمین</h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-ink-soft">کلوث استور — پنل مدیریت</p>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-ink-soft">
          رمز عبور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="glass-input w-full rounded-xl border border-ink/10 px-4 py-3 outline-none ring-teal/30 focus:ring-2"
        />
      </div>
      {error ? <p className="text-sm text-peach">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-teal py-3 text-sm font-medium text-white hover:bg-teal-deep disabled:opacity-60"
      >
        {loading ? "..." : "ورود"}
      </button>
      <Link
        href="/"
        className="glass-input flex w-full items-center justify-center rounded-xl border border-ink/10 py-3 text-sm font-medium text-ink-soft transition hover:border-teal/30 hover:bg-mint/60 hover:text-teal-deep"
      >
        بازگشت به فروشگاه
      </Link>
    </form>
  );
}
