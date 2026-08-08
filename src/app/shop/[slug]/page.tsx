import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductGallery } from "@/components/ProductGallery";
import { formatPrice } from "@/lib/format";
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
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: PRODUCT_INCLUDE,
  });
  if (!product) notFound();

  const gallery = product.images.length > 0
    ? product.images.map(({ url, altText }) => ({ url, altText }))
    : [{ url: product.imageUrl, altText: product.name }];
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
        product.stock > 0
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

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={gallery} productName={product.name} />

        <div className="glass-surface animate-fade-up flex flex-col justify-center rounded-3xl p-6 sm:p-8">
          {product.labels.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {product.labels.map(({ id, name }) => (
                <span key={id} className="rounded-full bg-peach/20 px-3 py-1 text-xs font-medium text-ink">
                  {name}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-ink-soft">
            {product.category} · {product.ageGroup} · {product.gender}
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{product.name}</h1>
          <p className="mt-4 leading-8 text-ink-soft">{product.description}</p>
          {product.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2" aria-label="تگ‌های محصول">
              {product.tags.map(({ id, name }) => (
                <span key={id} className="rounded-full bg-mint px-3 py-1 text-xs text-ink-soft">#{name}</span>
              ))}
            </div>
          ) : null}
          <p className="mt-5 text-2xl text-teal-deep">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-ink-soft">
            موجودی: {product.stock.toLocaleString("fa-IR")} عدد
          </p>
          <div className="mt-8"><AddToCartButton product={product} /></div>
        </div>
      </div>
    </div>
  );
}
