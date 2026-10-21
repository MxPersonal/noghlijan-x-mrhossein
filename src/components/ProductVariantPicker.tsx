"use client";

import { useMemo, useState } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/format";

type Variant = {
  id: string; colorName: string | null; colorHex: string | null; size: string | null;
  price: number | null; stock: number; sku: string | null;
  attributes: Record<string, string>; images: string[];
};

type Props = {
  product: {
    id: string; name: string; slug: string; description: string; price: number;
    stock: number; imageUrl: string; category: string; ageGroup: string; gender: string;
    labels: { id: string; name: string }[];
    tags: { id: string; name: string }[];
  };
  gallery: { url: string; altText: string | null }[];
  variants: Variant[];
};

function choices(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((value): value is string => !!value)));
}

export function ProductVariantPicker({ product, gallery, variants }: Props) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const selected = variants.find(v => v.id === selectedId) ?? variants[0];
  const colors = useMemo(() => choices(variants.map(v => v.colorName)), [variants]);
  const sizes = useMemo(() => choices(variants.map(v => v.size)), [variants]);
  const customKeys = useMemo(() => Array.from(new Set(variants.flatMap(v => Object.keys(v.attributes)))), [variants]);
  const selectionPrice = selected?.price ?? product.price;
  const selectionStock = selected?.stock ?? product.stock;
  const selectedImages = selected?.images.length
    ? selected.images.map((url, i) => ({ url, altText: product.name + " " + (selected.colorName ?? "") + " تصویر " + (i + 1) }))
    : gallery;

  function choose(key: "colorName" | "size" | string, value: string) {
    if (!selected) return;
    // Prefer a matching combination of the other already-selected attributes.
    const exact = variants.find(v => (
      (key === "colorName" ? v.colorName === value : v.colorName === selected.colorName) &&
      (key === "size" ? v.size === value : v.size === selected.size) &&
      customKeys.every(k => (key === k ? v.attributes[k] === value : v.attributes[k] === selected.attributes[k]))
    ));
    const fallback = variants.find(v => key === "colorName" ? v.colorName === value
      : key === "size" ? v.size === value : v.attributes[key] === value);
    const next = exact ?? fallback;
    if (next) setSelectedId(next.id);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <ProductGallery key={selected?.id ?? product.id} images={selectedImages} productName={product.name} />

      <div className="glass-surface space-y-4 rounded-3xl p-6 sm:p-8">
        {product.labels.length > 0 && (
          <div className="flex flex-wrap gap-2">{product.labels.map(label => (
            <span key={label.id} className="rounded-full bg-peach/20 px-3 py-1 text-xs text-ink">{label.name}</span>
          ))}</div>
        )}
        <p className="text-sm text-ink-soft">{product.category} · {product.ageGroup} · {product.gender}</p>
        <h1 className="font-display text-4xl text-ink sm:text-5xl">{product.name}</h1>
        <p className="text-sm leading-8 text-ink-soft">{product.description}</p>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="برچسب‌ها">
            {product.tags.map(tag => <span key={tag.id} className="rounded-full bg-mint px-3 py-1 text-xs text-ink-soft">#{tag.name}</span>)}
          </div>
        )}

        {colors.length > 0 && (
          <fieldset className="border-t border-ink/10 pt-4">
            <legend className="mb-2 text-sm font-bold text-ink">
              رنگ: <span className="font-normal text-teal-deep">{selected?.colorName}</span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {colors.map(color => {
                const representative = variants.find(v => v.colorName === color);
                const isActive = selected?.colorName === color;
                return (
                  <button type="button" key={color} aria-label={"انتخاب رنگ " + color}
                    aria-pressed={isActive} title={color} onClick={() => choose("colorName", color)}
                    className={"flex min-h-11 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition " +
                      (isActive ? "border-teal bg-teal/10 text-teal-deep ring-2 ring-teal/15" : "border-ink/15 text-ink hover:border-teal/40")}>
                    <span className="size-6 shrink-0 rounded-full border border-ink/15 shadow-sm"
                      style={{ backgroundColor: representative?.colorHex ?? "#eeeeee" }} />
                    {color}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-bold text-ink">انتخاب سایز</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button type="button" key={size} aria-pressed={selected?.size === size}
                  onClick={() => choose("size", size)}
                  className={"min-h-11 rounded-xl border px-4 py-2 text-sm transition " +
                    (selected?.size === size ? "border-teal bg-teal text-white" : "border-ink/15 text-ink hover:border-teal")}>
                  {size}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {customKeys.map(key => {
          const values = choices(variants.map(v => v.attributes[key]));
          return (
            <fieldset key={key} className="space-y-2">
              <legend className="mb-2 text-sm font-bold text-ink">{key}</legend>
              <div className="flex flex-wrap gap-2">
                {values.map(value => (
                  <button type="button" key={value} onClick={() => choose(key, value)}
                    aria-pressed={selected?.attributes[key] === value}
                    className={"min-h-11 rounded-xl border px-4 py-2 text-sm transition " +
                      (selected?.attributes[key] === value ? "border-teal bg-teal text-white" : "border-ink/15 text-ink hover:border-teal")}>
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          );
        })}

        {selected && (
          <div className="rounded-xl bg-cream-deep/40 px-4 py-3 text-sm" aria-live="polite">
            <p className="font-medium text-ink">انتخاب فعلی: {[
              selected.colorName, selected.size && "سایز " + selected.size,
              ...Object.entries(selected.attributes).map(([key,value]) => key + " " + value),
            ].filter(Boolean).join(" · ") || "مدل اصلی"}</p>
            {selected.sku && <p className="mt-1 text-xs text-ink-soft" dir="ltr">SKU: {selected.sku}</p>}
          </div>
        )}

        <div aria-live="polite" className="border-t border-ink/10 pt-4">
          <p className="text-2xl font-bold text-teal-deep">{formatPrice(selectionPrice)}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {selectionStock > 0 ? "موجودی این ترکیب: " + selectionStock.toLocaleString("fa-IR") + " عدد" : "این ترکیب ناموجود است"}
          </p>
          <div className="mt-5">
            <AddToCartButton key={selected?.id ?? product.id}
              product={{
                id: product.id, slug: product.slug, name: product.name,
                price: selectionPrice, stock: selectionStock,
                imageUrl: selectedImages[0]?.url ?? product.imageUrl,
                variantId: selected?.id,
                variantLabel: selected
                  ? [selected.colorName, selected.size && "سایز " + selected.size,
                    ...Object.entries(selected.attributes).map(([k,v]) => k + ": " + v)].filter(Boolean).join(" · ")
                  : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
