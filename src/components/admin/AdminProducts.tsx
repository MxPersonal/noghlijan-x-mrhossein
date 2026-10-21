"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ProductImportPanel } from "@/components/admin/ProductImportPanel";
import { ProductVariantsEditor, newVariant, type VariantDraft } from "@/components/admin/ProductVariantsEditor";
import { StoreIntegrationsPanel } from "@/components/admin/StoreIntegrationsPanel";
import { formatPrice } from "@/lib/format";
import { isProductImagePlaceholder } from "@/lib/product-images";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ProductImage = {
  id?: string;
  url: string;
  altText: string | null;
  sortOrder?: number;
};

type ProductTerm = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  ageGroup: string;
  gender: string;
  stock: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  images: ProductImage[];
  tags: ProductTerm[];
  labels: ProductTerm[];
  variants: { id: string; colorName: string | null; colorHex: string | null; size: string | null; sku: string | null; price: number | null; stock: number; attributes: unknown; images: unknown }[];
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  category: string;
  ageGroup: string;
  gender: string;
  stock: string;
  images: ProductImage[];
  variants: VariantDraft[];
  tags: string;
  labels: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: "",
  ageGroup: "",
  gender: "یونیسکس",
  stock: "0",
  images: [],
  variants: [],
  tags: "",
  labels: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

function productImages(product: Product): ProductImage[] {
  const byUrl = new Map<string, ProductImage>();
  byUrl.set(product.imageUrl, {
    url: product.imageUrl,
    altText: `${product.name} - تصویر اصلی`,
  });
  for (const image of product.images) byUrl.set(image.url, image);

  const primary = byUrl.get(product.imageUrl)!;
  byUrl.delete(product.imageUrl);
  return [primary, ...byUrl.values()];
}

function splitTerms(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[،,]/)
        .map((term) => term.trim().replace(/^#+/, ""))
        .filter(Boolean),
    ),
  );
}

function attributesFromText(value: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of value.split(/[\r\n]+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const index = line.indexOf("=");
    if (index < 1 || !line.slice(index + 1).trim()) {
      throw Error("ویژگی‌های سفارشی باید در هر خط به فرم نام=مقدار باشند");
    }
    parsed[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return parsed;
}

export function AdminProducts({ initial }: { initial: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadRequestIdRef = useRef(0);

  function clearImageSelection() {
    uploadRequestIdRef.current += 1;
    setUploadError("");
    setUploadProgress("");
    setUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function startEdit(product: Product) {
    clearImageSelection();
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      category: product.category,
      ageGroup: product.ageGroup,
      gender: product.gender,
      stock: String(product.stock),
      images: productImages(product),
      variants: (product.variants ?? []).map(v => ({
        id: v.id, colorName: v.colorName || "", colorHex: v.colorHex || "#e9a3b5",
        size: v.size || "", sku: v.sku || "", price: v.price == null ? "" : String(v.price),
        stock: String(v.stock),
        attributesText: v.attributes && typeof v.attributes === "object" && !Array.isArray(v.attributes)
          ? Object.entries(v.attributes as Record<string,string>).map(([key,val]) => key + "=" + val).join("\n") : "",
        images: Array.isArray(v.images) ? v.images.filter((url): url is string => typeof url === "string") : [],
      })),
      tags: product.tags.map(({ name }) => name).join("، "),
      labels: product.labels.map(({ name }) => name).join("، "),
      seoTitle: product.seoTitle ?? "",
      seoDescription: product.seoDescription ?? "",
      seoKeywords: product.seoKeywords ?? "",
    });
    setError("");
  }

  function resetForm() {
    clearImageSelection();
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function reloadProducts() {
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      if (response.ok) setProducts((await response.json()) as Product[]);
    } finally {
      router.refresh();
    }
  }

  async function uploadImage(file: File): Promise<string> {
    const uploadData = new FormData();
    uploadData.append("file", file);
    const response = await fetch("/api/admin/products/images", {
      method: "POST",
      body: uploadData,
    });
    const data = (await response.json()) as {
      imageUrl?: unknown;
      error?: unknown;
    };
    if (!response.ok || typeof data.imageUrl !== "string") {
      throw new Error(
        typeof data.error === "string" ? data.error : "آپلود تصویر ناموفق بود",
      );
    }
    return data.imageUrl;
  }

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    setUploadError("");
    setError("");
    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type));
    if (invalidType) {
      setUploadError(`فرمت «${invalidType.name}» باید JPEG، PNG یا WebP باشد`);
      input.value = "";
      return;
    }
    const emptyFile = files.find((file) => file.size === 0);
    if (emptyFile) {
      setUploadError(`فایل «${emptyFile.name}» خالی است`);
      input.value = "";
      return;
    }
    if (form.images.length + files.length > 24) {
      setUploadError("برای هر محصول حداکثر ۲۴ تصویر مجاز است");
      input.value = "";
      return;
    }

    const requestId = ++uploadRequestIdRef.current;
    setUploading(true);
    try {
      const uploaded: ProductImage[] = [];
      for (const [index, file] of files.entries()) {
        setUploadProgress(
          `در حال آپلود ${(index + 1).toLocaleString("fa-IR")} از ${files.length.toLocaleString("fa-IR")}`,
        );
        const url = await uploadImage(file);
        if (requestId !== uploadRequestIdRef.current) return;
        uploaded.push({
          url,
          altText: form.name
            ? `${form.name} - تصویر ${(form.images.length + index + 1).toLocaleString("fa-IR")}`
            : file.name.replace(/\.[^.]+$/, ""),
        });
      }
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
      setUploadProgress(`${files.length.toLocaleString("fa-IR")} تصویر با موفقیت آپلود شد`);
      input.value = "";
    } catch (uploadFailure) {
      if (requestId !== uploadRequestIdRef.current) return;
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "آپلود تصویر ناموفق بود",
      );
      input.value = "";
    } finally {
      if (requestId === uploadRequestIdRef.current) setUploading(false);
    }
  }

  function updateImage(index: number, patch: Partial<ProductImage>) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image,
      ),
    }));
  }

  function makePrimary(index: number) {
    setForm((current) => {
      const images = [...current.images];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);
      return { ...current, images };
    });
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (uploading) return;
    const primaryImage = form.images[0]?.url;
    if (!primaryImage || isProductImagePlaceholder(primaryImage)) {
      setError("ابتدا حداقل یک تصویر محصول را انتخاب و آپلود کنید");
      return;
    }

    let variants;
    try {
      variants = form.variants.map((variant) => ({
        id: variant.id,
        colorName: variant.colorName.trim() || null,
        colorHex: variant.colorName.trim() ? variant.colorHex : null,
        size: variant.size.trim() || null,
        sku: variant.sku.trim() || null,
        price: variant.price.trim() === "" ? null : Number(variant.price),
        stock: Number(variant.stock),
        attributes: attributesFromText(variant.attributesText),
        images: variant.images,
      }));
      if (variants.some(v => v.images.length === 0)) throw Error("هر ترکیب ویژگی باید حداقل یک تصویر داشته باشد");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "اطلاعات ترکیب‌ها نامعتبر است");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      id: editingId ?? undefined,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: Number(form.price),
      imageUrl: primaryImage,
      images: form.images.map(({ url, altText }) => ({ url, altText })),
      variants,
      category: form.category,
      ageGroup: form.ageGroup,
      gender: form.gender,
      stock: Number(form.stock),
      tags: splitTerms(form.tags),
      labels: splitTerms(form.labels),
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoKeywords: splitTerms(form.seoKeywords),
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as Product & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "خطا در ذخیره");

      setProducts((current) =>
        editingId
          ? current.map((product) => (product.id === editingId ? data : product))
          : [data, ...current],
      );
      resetForm();
      router.refresh();
    } catch (saveFailure) {
      setError(saveFailure instanceof Error ? saveFailure.message : "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("این محصول از فروشگاه آرشیو شود؟")) return;
    const response = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setProducts((current) => current.filter((product) => product.id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    }
  }

  return (
    <>
      <StoreIntegrationsPanel onImported={() => void reloadProducts()} />
      <ProductImportPanel onImported={() => void reloadProducts()} />

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={onSubmit}
          className="glass-surface space-y-4 rounded-2xl p-5"
        >
          <h2 className="font-display text-2xl text-ink">
            {editingId ? "ویرایش محصول" : "محصول جدید"}
          </h2>

          {(
            [
              ["name", "نام"],
              ["slug", "اسلاگ (اختیاری)"],
              ["price", "قیمت (تومان)"],
              ["stock", "موجودی"],
              ["category", "دسته"],
              ["ageGroup", "گروه سنی"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-ink-soft">
              {label}
              <input
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                required={key !== "slug"}
                inputMode={key === "price" || key === "stock" ? "numeric" : undefined}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
          ))}

          <label className="block text-xs text-ink-soft">
            جنسیت
            <select
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
            >
              <option>دخترانه</option>
              <option>پسرانه</option>
              <option>یونیسکس</option>
            </select>
          </label>

          <label className="block text-xs text-ink-soft">
            توضیحات
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>

          <fieldset className="rounded-xl border border-ink/10 p-3">
            <legend className="px-2 text-sm font-medium text-ink">گالری تصاویر</legend>
            <label htmlFor="product-images" className="mb-1 block text-xs text-ink-soft">
              افزودن یک یا چند تصویر
            </label>
            <input
              ref={imageInputRef}
              id="product-images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading || saving}
              onChange={onImageChange}
              className="glass-input block w-full rounded-lg border border-ink/10 px-3 py-2 text-sm file:ml-3 file:rounded-md file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-ink-soft">
              JPEG، PNG یا WebP؛ تصویر اول، تصویر اصلی محصول است.
            </p>
            <div aria-live="polite">
              {uploadProgress ? <p className="mt-2 text-sm text-teal">{uploadProgress}</p> : null}
              {uploadError ? <p className="mt-2 text-sm text-peach">{uploadError}</p> : null}
            </div>

            {form.images.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="rounded-xl bg-cream/50 p-2 ring-1 ring-ink/8">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-mint">
                      <Image
                        src={image.url}
                        alt={image.altText ?? form.name ?? "تصویر محصول"}
                        fill
                        unoptimized={/^https?:\/\//i.test(image.url)}
                        sizes="240px"
                        className="object-cover"
                      />
                      {index === 0 ? (
                        <span className="absolute right-2 top-2 rounded-full bg-teal px-2 py-1 text-[10px] text-white">
                          تصویر اصلی
                        </span>
                      ) : null}
                    </div>
                    <label className="mt-2 block text-xs text-ink-soft">
                      متن جایگزین تصویر
                      <input
                        value={image.altText ?? ""}
                        maxLength={160}
                        onChange={(event) => updateImage(index, { altText: event.target.value })}
                        className="glass-input mt-1 w-full rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {index > 0 ? (
                        <button type="button" onClick={() => makePrimary(index)} className="text-teal hover:underline">
                          انتخاب به‌عنوان اصلی
                        </button>
                      ) : null}
                      <button type="button" onClick={() => removeImage(index)} className="text-peach hover:underline">
                        حذف تصویر
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-peach/10 p-2 text-xs text-ink-soft">
                هنوز تصویری انتخاب نشده است.
              </p>
            )}
          </fieldset>

          <ProductVariantsEditor
            value={form.variants}
            onChange={(variants) => setForm((current) => ({ ...current, variants }))}
            gallery={form.images}
            disabled={saving || uploading}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-ink-soft">
              تگ‌ها
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                placeholder="نخی، تابستانی، روزمره"
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-ink-soft">
              لیبل‌های نمایشی
              <input
                value={form.labels}
                onChange={(event) => setForm({ ...form, labels: event.target.value })}
                placeholder="جدید، پرفروش"
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="-mt-2 text-xs text-ink-soft">موارد را با ویرگول فارسی یا انگلیسی جدا کنید.</p>

          <fieldset className="space-y-3 rounded-xl border border-ink/10 p-3">
            <legend className="px-2 text-sm font-medium text-ink">تنظیمات SEO</legend>
            <label className="block text-xs text-ink-soft">
              عنوان SEO ({form.seoTitle.length.toLocaleString("fa-IR")}/۷۰)
              <input
                value={form.seoTitle}
                maxLength={70}
                onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-ink-soft">
              توضیحات SEO ({form.seoDescription.length.toLocaleString("fa-IR")}/۱۷۰)
              <textarea
                value={form.seoDescription}
                maxLength={170}
                rows={3}
                onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs text-ink-soft">
              کلیدواژه‌های SEO
              <input
                value={form.seoKeywords}
                onChange={(event) => setForm({ ...form, seoKeywords: event.target.value })}
                placeholder="لباس کودک، لباس نخی"
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-ink-soft">
              اگر عنوان یا توضیحات SEO خالی باشد، نام و توضیحات اصلی محصول استفاده می‌شود.
            </p>
          </fieldset>

          {error ? <p className="text-sm text-peach">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading || !form.images[0]?.url || isProductImagePlaceholder(form.images[0]?.url ?? "")}
              className="rounded-xl bg-teal px-4 py-2 text-sm text-white hover:bg-teal-deep disabled:opacity-60"
            >
              {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن محصول"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-xl bg-cream-deep px-4 py-2 text-sm">
                انصراف
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <h2 className="font-display text-2xl text-ink">لیست محصولات</h2>
          <ul className="max-h-[80vh] space-y-2 overflow-auto">
            {products.map((product) => (
              <li key={product.id} className="glass-soft rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-ink-soft">
                      {product.category} · {formatPrice(product.price)} · موجودی {product.stock.toLocaleString("fa-IR")} · {productImages(product).length.toLocaleString("fa-IR")} تصویر
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.labels.map(({ id, name }) => (
                        <span key={id} className="rounded-full bg-peach/15 px-2 py-0.5 text-[10px] text-ink">{name}</span>
                      ))}
                      {product.tags.slice(0, 4).map(({ id, name }) => (
                        <span key={id} className="rounded-full bg-mint px-2 py-0.5 text-[10px] text-ink-soft">#{name}</span>
                      ))}
                    </div>
                    {isProductImagePlaceholder(product.imageUrl) ? (
                      <p className="mt-1 text-xs font-medium text-peach">بدون تصویر — برای افزودن عکس، ویرایش کنید</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => startEdit(product)} className="text-teal hover:underline">ویرایش</button>
                    <button type="button" onClick={() => onDelete(product.id)} className="text-peach hover:underline">آرشیو</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
