import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { ExternalProvider } from "@/generated/prisma/enums";
import {
  getIntegrationConfig,
  markIntegrationConnected,
  markIntegrationError,
  type FeedIntegrationConfig,
  type InstagramIntegrationConfig,
} from "@/lib/integration-settings";
import { prisma } from "@/lib/prisma";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/product-images";

export const EXTERNAL_PROVIDERS = [
  "TOROB",
  "DIGIKALA",
  "INSTAGRAM",
] as const;

export type ExternalProviderName = (typeof EXTERNAL_PROVIDERS)[number];

export type ExternalProductData = {
  externalId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  ageGroup: string;
  gender: string;
  stock: number;
};

export type IntegrationStatus = {
  provider: ExternalProviderName;
  label: string;
  configured: boolean;
  connected: boolean;
  accountLabel?: string;
  message: string;
};

const PROVIDER_LABELS: Record<ExternalProviderName, string> = {
  TOROB: "ترب",
  DIGIKALA: "دیجی‌کالا",
  INSTAGRAM: "Instagram",
};

const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_INSTAGRAM_PAGES = 50;
const MAX_DATABASE_INT = 2_147_483_647;
const META_GRAPH_VERSION = "v24.0";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function numberValue(value: unknown): number | null {
  if (isRecord(value)) {
    for (const key of ["value", "amount", "selling_price", "price"]) {
      const parsed = numberValue(value[key]);
      if (parsed != null) return parsed;
    }
    return null;
  }

  const normalized = stringValue(value)
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٬،,\s]/g, "")
    .replace(/تومان|ریال/gi, "");
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(record: JsonRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] != null) return record[key];
  }
  return undefined;
}

function safeText(value: unknown, fallback: string, maxLength: number): string {
  return (stringValue(value) || fallback).slice(0, maxLength);
}

function safeImageUrl(value: unknown): string {
  const candidate = stringValue(value);
  if (!candidate) return PRODUCT_IMAGE_PLACEHOLDER;

  try {
    const url = new URL(candidate);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    ) {
      return url.toString();
    }
  } catch {
    // Invalid external image URLs use the local placeholder.
  }

  return PRODUCT_IMAGE_PLACEHOLDER;
}

function normalizeGender(value: unknown): string {
  const gender = stringValue(value).toLowerCase();
  if (["female", "girl", "girls", "دخترانه", "زنانه"].includes(gender)) {
    return "دخترانه";
  }
  if (["male", "boy", "boys", "پسرانه", "مردانه"].includes(gender)) {
    return "پسرانه";
  }
  return "یونیسکس";
}

function getFeedItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of ["products", "items", "results", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = getFeedItems(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function isPrivateIp(address: string): boolean {
  if (address.includes(":")) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice("::ffff:".length));
    }
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff")
    );
  }

  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertSafeFeedUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  const localDevelopment =
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) {
    throw new Error("آدرس فید باید HTTPS باشد");
  }
  if (url.username || url.password) {
    throw new Error("نام کاربری یا رمز نباید داخل آدرس فید قرار گیرد");
  }

  if (!localDevelopment) {
    const addresses = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
      throw new Error("آدرس فید عمومی و معتبر نیست");
    }
  }

  return url;
}

async function fetchJson(url: URL, token?: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`سرویس بیرونی پاسخ ${response.status} داد`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error("پاسخ سرویس بیش از حد بزرگ است");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error("پاسخ سرویس بیش از حد بزرگ است");
  }

  try {
    return JSON.parse(new TextDecoder().decode(buffer)) as unknown;
  } catch {
    throw new Error("پاسخ سرویس JSON معتبر نیست");
  }
}

async function getFeedConfig(
  provider: "TOROB" | "DIGIKALA",
): Promise<FeedIntegrationConfig> {
  const config = await getIntegrationConfig<FeedIntegrationConfig>(
    ExternalProvider[provider],
  );
  if (!config?.feedUrl) {
    throw new Error(`تنظیمات ${PROVIDER_LABELS[provider]} در پنل تکمیل نشده است`);
  }
  return config;
}

async function fetchFeedProducts(
  provider: "TOROB" | "DIGIKALA",
): Promise<ExternalProductData[]> {
  const config = await getFeedConfig(provider);
  const payload = await fetchJson(
    await assertSafeFeedUrl(config.feedUrl),
    config.apiToken || undefined,
  );
  const items = getFeedItems(payload);
  if (items.length === 0) throw new Error("هیچ کالایی در پاسخ فید پیدا نشد");

  const label = PROVIDER_LABELS[provider];
  return items.flatMap((value, index) => {
    if (!isRecord(value)) return [];

    const name = safeText(firstValue(value, ["name", "title", "product_name"]), "", 200);
    const rawPrice = numberValue(
      firstValue(value, ["price", "sale_price", "selling_price"]),
    );
    if (!name || rawPrice == null || rawPrice < 0) return [];

    const externalId = safeText(
      firstValue(value, ["id", "externalId", "external_id", "product_id", "sku"]),
      createHash("sha256")
        .update(`${name}:${stringValue(firstValue(value, ["url", "link"]))}:${index}`)
        .digest("hex"),
      200,
    );
    const divisor = Math.max(1, config.priceDivisor || 1);
    const price = Math.min(
      MAX_DATABASE_INT,
      Math.max(0, Math.round(rawPrice / divisor)),
    );
    const stockValue = numberValue(
      firstValue(value, ["stock", "inventory", "quantity", "qty"]),
    );

    return [{
      externalId,
      name,
      description: safeText(value.description, name, 5_000),
      price,
      imageUrl: safeImageUrl(
        firstValue(value, ["imageUrl", "image_url", "image", "thumbnail"]),
      ),
      category: safeText(firstValue(value, ["category", "category_name"]), label, 100),
      ageGroup: safeText(firstValue(value, ["ageGroup", "age_group"]), "همه سنین", 100),
      gender: normalizeGender(value.gender),
      stock: Math.min(MAX_DATABASE_INT, Math.max(0, Math.round(stockValue ?? 0))),
    }];
  });
}

async function getInstagramConfig(): Promise<InstagramIntegrationConfig> {
  const config = await getIntegrationConfig<InstagramIntegrationConfig>(
    ExternalProvider.INSTAGRAM,
  );
  if (!config?.appId || !config.appSecret) {
    throw new Error("تنظیم اولیه برنامه Meta در پنل تکمیل نشده است");
  }
  return config;
}

function instagramGraphUrl(path: string, fields: string): URL {
  const safePath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = new URL(
    `https://graph.instagram.com/${META_GRAPH_VERSION}/${safePath}`,
  );
  url.searchParams.set("fields", fields);
  return url;
}

async function checkInstagram(): Promise<string> {
  const config = await getInstagramConfig();
  if (!config.userId || !config.accessToken) {
    throw new Error("ابتدا با حساب حرفه‌ای Instagram وارد شوید");
  }
  const payload = await fetchJson(
    instagramGraphUrl(config.userId, "id,username,account_type"),
    config.accessToken,
  );
  if (!isRecord(payload) || !stringValue(payload.id)) {
    throw new Error("حساب حرفه‌ای Instagram شناسایی نشد");
  }
  return stringValue(payload.username) || stringValue(payload.id);
}

async function fetchInstagramProducts(): Promise<ExternalProductData[]> {
  const config = await getInstagramConfig();
  await checkInstagram();
  if (!config.userId || !config.accessToken) {
    throw new Error("اتصال Instagram کامل نشده است");
  }

  let nextUrl: URL | null = instagramGraphUrl(
    `${config.userId}/media`,
    "id,caption,media_type,media_url,thumbnail_url,permalink",
  );
  nextUrl.searchParams.set("limit", "100");
  const products: ExternalProductData[] = [];

  for (let page = 0; nextUrl && page < MAX_INSTAGRAM_PAGES; page += 1) {
    const payload: unknown = await fetchJson(nextUrl, config.accessToken);
    if (!isRecord(payload)) break;

    for (const value of getFeedItems(payload)) {
      if (!isRecord(value)) continue;
      const externalId = stringValue(value.id);
      if (!externalId) continue;
      const caption = stringValue(value.caption);
      const firstLine = caption.split(/\r?\n/, 1)[0]?.trim();
      const name = safeText(firstLine, `پست Instagram ${externalId}`, 200);

      products.push({
        externalId,
        name,
        description: safeText(caption, name, 5_000),
        price: 0,
        imageUrl: safeImageUrl(value.media_url ?? value.thumbnail_url),
        category: "Instagram",
        ageGroup: "همه سنین",
        gender: "یونیسکس",
        stock: 0,
      });
    }

    const paging = isRecord(payload.paging) ? payload.paging : null;
    const next = paging ? stringValue(paging.next) : "";
    if (!next) {
      nextUrl = null;
      continue;
    }

    const candidate = new URL(next);
    if (candidate.protocol !== "https:" || candidate.hostname !== "graph.instagram.com") {
      throw new Error("آدرس صفحه‌بندی Instagram معتبر نیست");
    }
    candidate.searchParams.delete("access_token");
    nextUrl = candidate;
  }

  if (products.length === 0) {
    throw new Error("پستی برای ورود از حساب Instagram پیدا نشد");
  }
  return products;
}

export async function getIntegrationStatus(
  provider: ExternalProviderName,
): Promise<IntegrationStatus> {
  const label = PROVIDER_LABELS[provider];
  const stored = await prisma.storeIntegration.findUnique({
    where: { provider: ExternalProvider[provider] },
  });
  if (!stored) {
    return {
      provider,
      label,
      configured: false,
      connected: false,
      message: "تنظیم اتصال را از همین پنل تکمیل کنید",
    };
  }

  const expired = Boolean(
    stored.tokenExpiresAt && stored.tokenExpiresAt.getTime() <= Date.now(),
  );
  const connected = Boolean(stored.connectedAt && !expired);
  return {
    provider,
    label,
    configured: true,
    connected,
    accountLabel: stored.accountLabel ?? undefined,
    message: expired
      ? "دسترسی منقضی شده است؛ دوباره وارد حساب شوید"
      : stored.lastError
        ? stored.lastError
        : connected
          ? "اتصال با موفقیت تأیید شده است"
          : provider === "INSTAGRAM"
            ? "تنظیم اولیه ذخیره شده؛ اکنون با Instagram وارد شوید"
            : "تنظیم ذخیره شده؛ اتصال را بررسی کنید",
  };
}

export async function checkIntegration(
  provider: ExternalProviderName,
): Promise<IntegrationStatus> {
  const prismaProvider = ExternalProvider[provider];
  try {
    const accountLabel =
      provider === "INSTAGRAM"
        ? await checkInstagram()
        : `${(await fetchFeedProducts(provider)).length.toLocaleString("fa-IR")} کالا`;
    await markIntegrationConnected(prismaProvider, { accountLabel });
    return getIntegrationStatus(provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : "اتصال ناموفق بود";
    await markIntegrationError(prismaProvider, message);
    return {
      provider,
      label: PROVIDER_LABELS[provider],
      configured: Boolean(
        await prisma.storeIntegration.findUnique({ where: { provider: prismaProvider } }),
      ),
      connected: false,
      message,
    };
  }
}

export async function getExternalProducts(
  provider: ExternalProviderName,
): Promise<ExternalProductData[]> {
  return provider === "INSTAGRAM"
    ? fetchInstagramProducts()
    : fetchFeedProducts(provider);
}
