import { prisma } from "@/lib/prisma";

/**
 * The repository originally contains SQLite Prisma migrations, while production
 * now runs PostgreSQL. Provision the additive variant tables only as part of
 * an authenticated admin write. Existing product/order rows are never reset.
 */
export async function ensureVariantStorage() {
  await prisma.$executeRawUnsafe(
    "CREATE TABLE IF NOT EXISTS \"ProductVariant\" (" +
      "\"id\" TEXT NOT NULL PRIMARY KEY," +
      "\"productId\" TEXT NOT NULL REFERENCES \"Product\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE," +
      "\"colorName\" TEXT, \"colorHex\" TEXT, \"size\" TEXT," +
      "\"attributes\" JSONB NOT NULL DEFAULT '{}'::jsonb," +
      "\"images\" JSONB NOT NULL DEFAULT '[]'::jsonb," +
      "\"price\" INTEGER, \"stock\" INTEGER NOT NULL DEFAULT 0, \"sku\" TEXT," +
      "\"sortOrder\" INTEGER NOT NULL DEFAULT 0," +
      "\"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "\"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)"
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder")'
  );
  await prisma.$executeRawUnsafe('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT');
}

export function isMissingVariantStorage(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = error instanceof Error ? error.message : "";
  const code = "code" in error ? String(error.code) : "";
  return code === "P2021" || code === "P2022" ||
    (message.includes("ProductVariant") && /does not exist|doesn't exist|not exist|relation/i.test(message));
}

export type VariantInput = {
  id?: string;
  colorName: string | null;
  colorHex: string | null;
  size: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  images: string[];
  price: number | null;
  stock: number;
};

export function normalizeVariants(value: unknown): VariantInput[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 48) throw Error("حداکثر ۴۸ ترکیب ویژگی مجاز است");
  const combos = new Set<string>();
  return value.map((item: unknown, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw Error("ویژگی محصول نامعتبر است");
    const v = item as Record<string, unknown>;
    const text = (k: string, max: number) => {
      if (v[k] == null || v[k] === "") return null;
      if (typeof v[k] !== "string" || v[k].trim().length > max) throw Error("مقدار ویژگی نامعتبر است");
      return v[k].trim() || null;
    };
    const colorName = text("colorName", 60);
    const colorHex = text("colorHex", 7);
    if (colorHex && !/^#[0-9a-fA-F]{6}$/.test(colorHex)) throw Error("کد رنگ باید به فرم #FFAA33 باشد");
    const size = text("size", 60);
    const sku = text("sku", 100);
    const attrs: Record<string, string> = {};
    if (v.attributes != null) {
      if (!v.attributes || typeof v.attributes !== "object" || Array.isArray(v.attributes)) throw Error("ویژگی‌ها نامعتبرند");
      for (const [k, raw] of Object.entries(v.attributes)) {
        if (!k.trim() || k.length > 60 || typeof raw !== "string" || !raw.trim() || raw.length > 120)
          throw Error("نام یا مقدار ویژگی نامعتبر است");
        attrs[k.trim()] = raw.trim();
      }
      if (Object.keys(attrs).length > 12) throw Error("هر ترکیب حداکثر ۱۲ ویژگی سفارشی دارد");
    }
    if (!Array.isArray(v.images) || v.images.length === 0 || v.images.length > 12 ||
        v.images.some(u => typeof u !== "string" || u.length > 2048 || !(u.startsWith("/images/") || u.startsWith("https://"))))
      throw Error("برای هر ترکیب باید ۱ تا ۱۲ تصویر معتبر وارد کنید");
    const stock = Number(v.stock);
    const price = v.price === null || v.price === "" || v.price === undefined ? null : Number(v.price);
    if (!Number.isSafeInteger(stock) || stock < 0 || (price !== null && (!Number.isSafeInteger(price) || price < 0)))
      throw Error("قیمت یا موجودی ترکیب نامعتبر است");
    const key = JSON.stringify([colorName, size, Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b))]);
    if (combos.has(key)) throw Error("دو ترکیب ویژگی یکسان ثبت شده‌اند");
    combos.add(key);
    const id = text("id", 100);
    return { id: id ?? undefined, colorName, colorHex, size, sku, attributes: attrs,
      images: v.images as string[], price, stock };
  });
}

export function variantLabel(variant: { colorName: string | null; size: string | null; attributes: unknown }): string {
  const other = variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes)
    ? Object.entries(variant.attributes as Record<string, unknown>).filter(([, v]) => typeof v === "string")
      .map(([k,v]) => k + ": " + v) : [];
  return [variant.colorName, variant.size && "سایز " + variant.size, ...other].filter(Boolean).join(" · ") || "گزینهٔ انتخابی";
}

export function variantImages(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
