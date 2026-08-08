import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  optionalText,
  parseProductImages,
  parseSeoKeywords,
  parseTerms,
} from "@/lib/product-details";
import { prisma } from "@/lib/prisma";

const PRODUCT_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" as const } },
  tags: { orderBy: { name: "asc" as const } },
  labels: { orderBy: { name: "asc" as const } },
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string") throw new Error(`${label} معتبر نیست`);
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} الزامی است`);
  if (normalized.length > maxLength) throw new Error(`${label} بیش از حد طولانی است`);
  return normalized;
}

function nonNegativeInteger(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} نامعتبر است`);
  return Math.round(parsed);
}

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\u0600-\u06FF-]/g, "")
      .slice(0, 80) || `product-${Date.now()}`
  );
}

function termConnections(names: string[]) {
  return names.map((name) => ({
    where: { name },
    create: { name },
  }));
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new Error("درخواست نامعتبر است");
    }
    return body as Record<string, unknown>;
  } catch {
    throw new Error("درخواست نامعتبر است");
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: PRODUCT_INCLUDE,
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);
  if (!hasSameOrigin(request)) return errorResponse("مبدأ درخواست معتبر نیست", 403);

  try {
    const body = await readBody(request);
    const name = requiredText(body.name, "نام", 160);
    const description = requiredText(body.description, "توضیحات", 5_000);
    const category = requiredText(body.category, "دسته", 100);
    const ageGroup = requiredText(body.ageGroup, "گروه سنی", 100);
    const gender = requiredText(body.gender, "جنسیت", 50);
    const price = nonNegativeInteger(body.price, "قیمت");
    const stock = nonNegativeInteger(body.stock ?? 0, "موجودی");
    const submittedSlug = optionalText(body.slug, "اسلاگ", 80);
    let slug = submittedSlug || slugify(name);
    const imageUrl = requiredText(body.imageUrl, "تصویر اصلی", 2_048);
    const images = parseProductImages(body.images, imageUrl, name);
    const tags = parseTerms(body.tags, "تگ‌ها");
    const labels = parseTerms(body.labels, "لیبل‌ها");
    const seoTitle = optionalText(body.seoTitle, "عنوان SEO", 70);
    const seoDescription = optionalText(body.seoDescription, "توضیحات SEO", 170);
    const seoKeywords = parseSeoKeywords(body.seoKeywords);

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug.slice(0, 66)}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        imageUrl: images[0].url,
        category,
        ageGroup,
        gender,
        stock,
        seoTitle,
        seoDescription,
        seoKeywords,
        images: {
          create: images.map((image, sortOrder) => ({ ...image, sortOrder })),
        },
        tags: { connectOrCreate: termConnections(tags) },
        labels: { connectOrCreate: termConnections(labels) },
      },
      include: PRODUCT_INCLUDE,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "ثبت محصول ناموفق بود",
      400,
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);
  if (!hasSameOrigin(request)) return errorResponse("مبدأ درخواست معتبر نیست", 403);

  try {
    const body = await readBody(request);
    const id = requiredText(body.id, "شناسه", 100);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorResponse("محصول یافت نشد", 404);

    const name =
      body.name === undefined ? existing.name : requiredText(body.name, "نام", 160);
    const data: Prisma.ProductUpdateInput = {};
    if (body.name !== undefined) data.name = name;
    if (body.slug !== undefined) {
      data.slug = optionalText(body.slug, "اسلاگ", 80) || slugify(name);
    }
    if (body.description !== undefined) {
      data.description = requiredText(body.description, "توضیحات", 5_000);
    }
    if (body.price !== undefined) data.price = nonNegativeInteger(body.price, "قیمت");
    if (body.category !== undefined) {
      data.category = requiredText(body.category, "دسته", 100);
    }
    if (body.ageGroup !== undefined) {
      data.ageGroup = requiredText(body.ageGroup, "گروه سنی", 100);
    }
    if (body.gender !== undefined) {
      data.gender = requiredText(body.gender, "جنسیت", 50);
    }
    if (body.stock !== undefined) data.stock = nonNegativeInteger(body.stock, "موجودی");

    if (body.images !== undefined || body.imageUrl !== undefined) {
      const imageUrl =
        body.imageUrl === undefined
          ? existing.imageUrl
          : requiredText(body.imageUrl, "تصویر اصلی", 2_048);
      const images = parseProductImages(body.images, imageUrl, name);
      data.imageUrl = images[0].url;
      data.images = {
        deleteMany: {},
        create: images.map((image, sortOrder) => ({ ...image, sortOrder })),
      };
    }
    if (body.tags !== undefined) {
      const tags = parseTerms(body.tags, "تگ‌ها");
      data.tags = { set: [], connectOrCreate: termConnections(tags) };
    }
    if (body.labels !== undefined) {
      const labels = parseTerms(body.labels, "لیبل‌ها");
      data.labels = { set: [], connectOrCreate: termConnections(labels) };
    }
    if (body.seoTitle !== undefined) {
      data.seoTitle = optionalText(body.seoTitle, "عنوان SEO", 70);
    }
    if (body.seoDescription !== undefined) {
      data.seoDescription = optionalText(body.seoDescription, "توضیحات SEO", 170);
    }
    if (body.seoKeywords !== undefined) {
      data.seoKeywords = parseSeoKeywords(body.seoKeywords);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
    return NextResponse.json(product);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "ویرایش محصول ناموفق بود",
      400,
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);
  if (!hasSameOrigin(request)) return errorResponse("مبدأ درخواست معتبر نیست", 403);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return errorResponse("شناسه لازم است", 400);

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
