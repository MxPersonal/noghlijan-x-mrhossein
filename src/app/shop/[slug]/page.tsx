import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductVariantPicker } from "@/components/ProductVariantPicker";
import { isMissingVariantStorage, variantImages } from "@/lib/product-variants";

import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const PRODUCT_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" as const } },
  tags: { orderBy: { name: "asc" as const } },
  labels: { orderBy: { name: "asc" as const } },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: PRODUCT_INCLUDE,
  });
  if (!product) return { title: "محصول یافت نشد" };

  const images = product.images.length > 0
    ? product.images.map(({ url, altText }) => ({
        url: absoluteUrl(url),
        alt: altText || product.name,
      }))
    : [{ url: absoluteUrl(product.imageUrl), alt: product.name }];
  const keywords = [
    ...(product.seoKeywords?.split(",").map((keyword) => keyword.trim()) ?? []),
    ...product.tags.map(({ name }) => name),
  ].filter(Boolean);

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description,
    keywords: Array.from(new Set(keywords)),
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      url: `/shop/${product.slug}`,
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description,
      images,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product;
  try {
    product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { ...PRODUCT_INCLUDE, variants: { orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    if (!isMissingVariantStorage(error)) throw error;
    const legacy = await prisma.product.findFirst({
      where: { slug, isActive: true }, include: PRODUCT_INCLUDE,
    });
    product = legacy ? { ...legacy, variants: [] } : null;
  }
  if (!product) notFound();

  const gallery = product.images.length > 0
    ? product.images.map(({ url, altText }) => ({ url, altText }))
    : [{ url: product.imageUrl, altText: product.name }];
  const variants = product.variants.map((variant) => ({
    id: variant.id, colorName: variant.colorName, colorHex: variant.colorHex,
    size: variant.size, price: variant.price, stock: variant.stock, sku: variant.sku,
    attributes: variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes)
      ? Object.fromEntries(Object.entries(variant.attributes).filter((entry): entry is [string, string] =>
          typeof entry[1] === "string")) : {},
    images: variantImages(variant.images),
  }));
  const stock = variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : product.stock;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.description,
    sku: product.id,
    category: product.category,
    image: gallery.map(({ url }) => absoluteUrl(url)),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.slug}`),
      price: product.price * 10,
      priceCurrency: "IRR",
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/shop" className="mb-6 inline-block text-sm text-ink-soft hover:text-teal">
        ← بازگشت به فروشگاه
      </Link>

      <ProductVariantPicker
        product={{
          id: product.id, name: product.name, slug: product.slug, description: product.description,
          price: product.price, stock, imageUrl: product.imageUrl,
          category: product.category, ageGroup: product.ageGroup, gender: product.gender,
          labels: product.labels, tags: product.tags,
        }}
        gallery={gallery}
        variants={variants}
      />
    </div>
  );
}
