export type ProductImageInput = {
  url: string;
  altText: string;
};

const MAX_IMAGES = 24;
const MAX_TERMS = 30;

function cleanText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`${label} معتبر نیست`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} الزامی است`);
  if (normalized.length > maxLength) {
    throw new Error(`${label} نباید بیشتر از ${maxLength.toLocaleString("fa-IR")} نویسه باشد`);
  }
  return normalized;
}

export function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
): string | null {
  if (value == null || value === "") return null;
  return cleanText(value, label, maxLength);
}

function normalizeImageUrl(value: unknown): string {
  const url = cleanText(value, "آدرس تصویر", 2_048);
  if (url.startsWith("/images/")) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("آدرس تصویر باید از مسیر تصاویر سایت یا HTTPS استفاده کند");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("آدرس خارجی تصویر باید HTTPS و بدون اطلاعات ورود باشد");
  }
  return parsed.toString();
}

export function parseProductImages(
  value: unknown,
  primaryImageUrl: unknown,
  productName: string,
): ProductImageInput[] {
  const primary = normalizeImageUrl(primaryImageUrl);
  const supplied = Array.isArray(value) ? value : [];
  if (supplied.length > MAX_IMAGES) {
    throw new Error(`برای هر محصول حداکثر ${MAX_IMAGES.toLocaleString("fa-IR")} تصویر مجاز است`);
  }

  const parsed = supplied.map((item, index) => {
    const record =
      typeof item === "string"
        ? { url: item, altText: "" }
        : typeof item === "object" && item !== null
          ? (item as Record<string, unknown>)
          : null;
    if (!record) throw new Error("اطلاعات یکی از تصاویر معتبر نیست");

    const url = normalizeImageUrl(record.url);
    const altText =
      optionalText(record.altText, "متن جایگزین تصویر", 160) ??
      `${productName} - تصویر ${(index + 1).toLocaleString("fa-IR")}`;
    return { url, altText };
  });

  const byUrl = new Map<string, ProductImageInput>();
  for (const image of parsed) {
    if (!byUrl.has(image.url)) byUrl.set(image.url, image);
  }
  const primaryEntry = byUrl.get(primary) ?? {
    url: primary,
    altText: `${productName} - تصویر اصلی`,
  };
  byUrl.delete(primary);
  const images = [primaryEntry, ...byUrl.values()];
  if (images.length > MAX_IMAGES) {
    throw new Error(`برای هر محصول حداکثر ${MAX_IMAGES.toLocaleString("fa-IR")} تصویر مجاز است`);
  }
  return images;
}

export function parseTerms(value: unknown, label: string): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[،,]/)
      : value == null
        ? []
        : (() => {
            throw new Error(`${label} معتبر نیست`);
          })();

  if (raw.length > MAX_TERMS) {
    throw new Error(`تعداد ${label} نباید بیشتر از ${MAX_TERMS.toLocaleString("fa-IR")} باشد`);
  }

  if (raw.some((item) => typeof item !== "string")) {
    throw new Error(`${label} معتبر نیست`);
  }
  const nonEmpty = (raw as string[]).filter((item) => item.trim().length > 0);
  if (nonEmpty.length > MAX_TERMS) {
    throw new Error(`تعداد ${label} نباید بیشتر از ${MAX_TERMS.toLocaleString("fa-IR")} باشد`);
  }
  const normalized = nonEmpty.map((item) =>
    cleanText(item, label, 50).replace(/^#+/, ""),
  );
  return Array.from(new Set(normalized.filter(Boolean)));
}

export function parseSeoKeywords(value: unknown): string | null {
  const keywords = parseTerms(value, "کلیدواژه‌های SEO");
  return keywords.length > 0 ? keywords.join(", ") : null;
}
