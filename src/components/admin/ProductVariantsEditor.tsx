"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";

export type VariantDraft = {
  id?: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
  attributesText: string;
  images: string[];
};

export const newVariant = (): VariantDraft => ({
  colorName: "", colorHex: "#e9a3b5", size: "", sku: "",
  price: "", stock: "0", attributesText: "", images: [],
});

type Props = {
  value: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  gallery: { url: string; altText?: string | null }[];
  disabled?: boolean;
};

export function ProductVariantsEditor({ value, onChange, gallery, disabled }: Props) {
  const [selected, setSelected] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const active = value[selected] ?? value[0];
  const selectIndex = Math.min(selected, Math.max(0, value.length - 1));

  function setVariant(index: number, next: VariantDraft) {
    onChange(value.map((v, i) => i === index ? next : v));
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !active) return;
    if (active.images.length + files.length > 12) {
      setError("برای هر ترکیب حداکثر ۱۲ تصویر مجاز است");
      event.target.value = "";
      return;
    }
    const index = selectIndex;
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024 || !file.size) {
          throw Error("تصویر باید PNG، JPEG یا WebP و حداکثر ۴ مگابایت باشد");
        }
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/products/images", { method: "POST", body: form });
        const data = await response.json() as { imageUrl?: string; error?: string };
        if (!response.ok || !data.imageUrl) throw Error(data.error || "آپلود تصویر ناموفق بود");
        urls.push(data.imageUrl);
      }
      // Use the latest selected variant from the parent when the request completes.
      onChange(value.map((v, i) => i === index ? { ...v, images: [...v.images, ...urls] } : v));
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود ناموفق بود");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <fieldset className="space-y-4 rounded-2xl border-2 border-teal/15 bg-cream/30 p-4">
      <legend className="px-2 font-display text-2xl text-teal-deep">رنگ‌ها و ویژگی‌های محصول</legend>
      <p className="text-sm leading-7 text-ink-soft">
        هر ترکیب رنگ، سایز یا ویژگی یک گزینهٔ قابل خرید است. برای هر گزینه موجودی،
        قیمت اختیاری و چند تصویر تعیین کن. خریدار با یک کلیک بین گزینه‌ها جابه‌جا می‌شود.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {value.map((v, index) => (
          <button type="button" key={v.id || index} disabled={disabled || uploading}
            onClick={() => { setSelected(index); setError(""); }}
            className={"flex items-center gap-2 rounded-full border px-3 py-2 text-sm " +
              (index === selectIndex ? "border-teal bg-teal/10 text-teal-deep" : "border-ink/15 text-ink-soft")}>
            <span className="size-5 rounded-full border border-ink/15" style={{ backgroundColor: v.colorHex || "#eeeeee" }} />
            {v.colorName || "ترکیب " + (index + 1).toLocaleString("fa-IR")}
            {v.size ? " · " + v.size : ""}
          </button>
        ))}
        <button type="button" disabled={disabled || uploading || value.length >= 48}
          onClick={() => { onChange([...value, newVariant()]); setSelected(value.length); }}
          className="rounded-full border border-dashed border-teal px-4 py-2 text-sm font-semibold text-teal-deep disabled:opacity-50">
          + افزودن ترکیب
        </button>
      </div>

      {!active ? (
        <p className="rounded-xl bg-white/50 p-4 text-sm text-ink-soft">
          اگر محصول فقط یک مدل دارد، این بخش را خالی بگذار. برای چندرنگ یا چندسایز روی «افزودن ترکیب» بزن.
        </p>
      ) : (
        <div className="grid gap-4 rounded-2xl border border-ink/10 bg-white/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">ویرایش گزینهٔ {(selectIndex + 1).toLocaleString("fa-IR")}</h3>
            <button type="button" disabled={disabled || uploading}
              onClick={() => { onChange(value.filter((_, i) => i !== selectIndex)); setSelected(Math.max(0, selectIndex - 1)); }}
              className="rounded-full bg-peach/15 px-3 py-1.5 text-xs text-peach">حذف این ترکیب</button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink-soft">نام رنگ (مثلاً صورتی)
              <input className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm" value={active.colorName}
                onChange={e => setVariant(selectIndex, { ...active, colorName: e.target.value })} maxLength={60} />
            </label>
            <label className="text-xs text-ink-soft">کد رنگ (HEX)
              <div className="mt-1 flex items-center gap-2">
                <input type="color" aria-label="انتخاب رنگ" value={active.colorHex || "#e9a3b5"}
                  onChange={e => setVariant(selectIndex, { ...active, colorHex: e.target.value })}
                  className="size-10 rounded-lg" />
                <input className="glass-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm" dir="ltr"
                  value={active.colorHex} onChange={e => setVariant(selectIndex, { ...active, colorHex: e.target.value })} />
              </div>
            </label>
            <label className="text-xs text-ink-soft">سایز / اندازه
              <input className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                value={active.size} onChange={e => setVariant(selectIndex, { ...active, size: e.target.value })}
                placeholder="۲ تا ۴ سال / ۹۰ / XL" maxLength={60} />
            </label>
            <label className="text-xs text-ink-soft">کد محصول (SKU) اختیاری
              <input className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm" dir="ltr"
                value={active.sku} onChange={e => setVariant(selectIndex, { ...active, sku: e.target.value })}
                maxLength={100} placeholder="PINK-4Y" />
            </label>
            <label className="text-xs text-ink-soft">موجودی همین ترکیب
              <input className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm" inputMode="numeric"
                type="number" min="0" step="1" value={active.stock}
                onChange={e => setVariant(selectIndex, { ...active, stock: e.target.value })} />
            </label>
            <label className="text-xs text-ink-soft">قیمت مخصوص (تومان، اختیاری)
              <input className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm" inputMode="numeric"
                type="number" min="0" step="1" value={active.price}
                onChange={e => setVariant(selectIndex, { ...active, price: e.target.value })}
                placeholder="خالی = قیمت اصلی محصول" />
            </label>
          </div>

          <label className="text-xs text-ink-soft">ویژگی‌های بیشتر (هر خط «نام=مقدار»)
            <textarea className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm leading-7"
              rows={3} dir="auto" value={active.attributesText}
              onChange={e => setVariant(selectIndex, { ...active, attributesText: e.target.value })}
              placeholder={"جنس=نخی\nطرح=خرس\nفصل=بهار"} />
          </label>

          <div className="space-y-3 rounded-xl border border-ink/10 p-3">
            <h4 className="text-sm font-semibold text-ink">گالری مخصوص این ترکیب ({active.images.length.toLocaleString("fa-IR")})</h4>
            <p className="text-xs leading-6 text-ink-soft">
              تصویر اول، هنگام انتخاب این رنگ یا ویژگی در صفحهٔ محصول نمایش داده می‌شود.
            </p>
            {active.images.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {active.images.map((url, i) => (
                  <div key={url + i} className="relative aspect-square overflow-hidden rounded-xl bg-mint">
                    <Image src={url} alt="" fill unoptimized={/^https?:\/\//.test(url)}
                      sizes="120px" className="object-cover" />
                    <button type="button" aria-label="حذف تصویر" disabled={disabled || uploading}
                      onClick={() => setVariant(selectIndex, { ...active, images: active.images.filter((_, j) => j !== i) })}
                      className="absolute left-1 top-1 grid size-7 place-items-center rounded-full bg-black/70 text-white">×</button>
                    {i === 0 && <span className="absolute bottom-1 right-1 rounded-full bg-teal px-1.5 py-0.5 text-[10px] text-white">اصلی</span>}
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-ink-soft">هنوز تصویری برای این ترکیب انتخاب نشده است.</p>}
            {gallery.length > 0 && (
              <label className="block text-xs text-ink-soft">
                افزودن از تصاویر اصلی محصول
                <select value="" disabled={disabled || uploading || active.images.length >= 12}
                  onChange={e => {
                    if (e.target.value && !active.images.includes(e.target.value))
                      setVariant(selectIndex, { ...active, images: [...active.images, e.target.value] });
                  }}
                  className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm">
                  <option value="">انتخاب تصویر...</option>
                  {gallery.filter(img => !active.images.includes(img.url)).map(img =>
                    <option key={img.url} value={img.url}>{img.altText || img.url.split("/").pop()}</option>)}
                </select>
              </label>
            )}
            <label className="block text-xs text-ink-soft">آپلود یک یا چند تصویر مخصوص این رنگ
              <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp"
                disabled={disabled || uploading || active.images.length >= 12}
                onChange={uploadFiles}
                className="glass-input mt-1 block w-full rounded-xl p-2 text-xs" />
            </label>
            <label className="block text-xs text-ink-soft">
              یا افزودن آدرس تصویر (HTTPS / مسیر داخلی)
              <input type="url" placeholder="https://example.com/image.webp"
                disabled={disabled || uploading || active.images.length >= 12}
                className="glass-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const url = e.currentTarget.value.trim();
                    if (url.startsWith("https://") && !active.images.includes(url)) {
                      setVariant(selectIndex, { ...active, images: [...active.images, url] });
                      e.currentTarget.value = "";
                    }
                  }
                }} />
              <span className="mt-1 block">برای افزودن URL کلید Enter را بزن.</span>
            </label>
            {uploading && <p className="text-sm text-teal" role="status">در حال آپلود تصاویر به فضای ابری...</p>}
            {error && <p role="alert" className="text-sm text-peach">{error}</p>}
          </div>
        </div>
      )}
    </fieldset>
  );
}
