import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-url";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, content] = await Promise.all([
    prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    }),
    getSiteContent(),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.55 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.55 },
    ...(content.termsPublished ? [{
      url: absoluteUrl("/terms"), changeFrequency: "monthly" as const, priority: 0.4,
    }] : []),
    ...products.map(({ slug, updatedAt }) => ({
      url: absoluteUrl(`/shop/${slug}`),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
