import type { Prisma } from "@/generated/prisma/client";

export const MAX_PRODUCT_SEARCH_LENGTH = 80;

export function normalizeProductSearchQuery(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PRODUCT_SEARCH_LENGTH);
}

export function buildProductSearchWhere(
  searchTerm: string,
): Prisma.ProductWhereInput {
  if (!searchTerm) return {};

  return {
    OR: [
      { name: { contains: searchTerm } },
      { description: { contains: searchTerm } },
      { category: { contains: searchTerm } },
      { ageGroup: { contains: searchTerm } },
      { gender: { contains: searchTerm } },
      { seoKeywords: { contains: searchTerm } },
      { tags: { some: { name: { contains: searchTerm } } } },
      { labels: { some: { name: { contains: searchTerm } } } },
    ],
  };
}
