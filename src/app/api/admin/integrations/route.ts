import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ExternalProvider } from "@/generated/prisma/enums";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  EXTERNAL_PROVIDERS,
  checkIntegration,
  getExternalProducts,
  getIntegrationStatus,
  type ExternalProductData,
  type ExternalProviderName,
} from "@/lib/external-integrations";
import {
  createInstagramAuthorizationUrl,
  instagramCallbackUrl,
  INSTAGRAM_OAUTH_STATE_COOKIE,
  INSTAGRAM_OAUTH_STATE_MAX_AGE,
} from "@/lib/instagram-oauth";
import {
  disconnectIntegration,
  getIntegrationConfig,
  saveIntegrationConfig,
  type FeedIntegrationConfig,
  type InstagramIntegrationConfig,
} from "@/lib/integration-settings";
import {
  isProductImagePlaceholder,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "@/lib/product-images";
import { slugifyProduct } from "@/lib/product-import";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type IntegrationAction = "save" | "connect" | "disconnect" | "import";
type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProvider(value: unknown): value is ExternalProviderName {
  return (
    typeof value === "string" &&
    EXTERNAL_PROVIDERS.includes(value as ExternalProviderName)
  );
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function hasSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function stringField(
  value: unknown,
  label: string,
  maxLength: number,
  required = true,
): string {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new Error(`${label} معتبر نیست`);
  }
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${label} الزامی است`);
  if (normalized.length > maxLength) throw new Error(`${label} بیش از حد طولانی است`);
  return normalized;
}

async function publicSettings(provider: ExternalProviderName, origin: string) {
  if (provider === "INSTAGRAM") {
    const config = await getIntegrationConfig<InstagramIntegrationConfig>(
      ExternalProvider.INSTAGRAM,
    );
    return {
      appId: config?.appId ?? "",
      hasAppSecret: Boolean(config?.appSecret),
      callbackUrl: instagramCallbackUrl(origin),
    };
  }

  const config = await getIntegrationConfig<FeedIntegrationConfig>(
    ExternalProvider[provider],
  );
  return {
    feedUrl: config?.feedUrl ?? "",
    hasApiToken: Boolean(config?.apiToken),
    priceDivisor: config?.priceDivisor ?? 1,
  };
}

async function saveSettings(provider: ExternalProviderName, value: unknown) {
  if (!isRecord(value)) throw new Error("تنظیمات ارسال‌شده معتبر نیست");
  const prismaProvider = ExternalProvider[provider];

  if (provider === "INSTAGRAM") {
    const current = await getIntegrationConfig<InstagramIntegrationConfig>(
      prismaProvider,
    );
    const appId = stringField(value.appId, "App ID", 64);
    if (!/^\d+$/.test(appId)) throw new Error("App ID باید فقط عدد باشد");
    const submittedSecret = stringField(value.appSecret, "App Secret", 256, false);
    const appSecret = submittedSecret || current?.appSecret || "";
    if (!appSecret) throw new Error("App Secret الزامی است");

    const credentialsChanged =
      !current || current.appId !== appId || Boolean(submittedSecret);
    await saveIntegrationConfig(prismaProvider, {
      appId,
      appSecret,
      accessToken: credentialsChanged ? undefined : current.accessToken,
      userId: credentialsChanged ? undefined : current.userId,
    });
    if (credentialsChanged) {
      await prisma.storeIntegration.update({
        where: { provider: prismaProvider },
        data: {
          accountId: null,
          accountLabel: null,
          connectedAt: null,
          tokenExpiresAt: null,
        },
      });
    }
    return;
  }

  const feedUrl = stringField(value.feedUrl, "آدرس فید", 2_048);
  try {
    new URL(feedUrl);
  } catch {
    throw new Error("آدرس فید معتبر نیست");
  }
  const current = await getIntegrationConfig<FeedIntegrationConfig>(
    prismaProvider,
  );
  const submittedToken = stringField(value.apiToken, "توکن API", 8_192, false);
  const apiToken =
    value.clearApiToken === true
      ? ""
      : submittedToken || current?.apiToken || "";
  const priceDivisor = Number(value.priceDivisor);
  if (!Number.isInteger(priceDivisor) || priceDivisor < 1 || priceDivisor > 1_000) {
    throw new Error("ضریب تبدیل قیمت باید عددی بین ۱ تا ۱۰۰۰ باشد");
  }

  await saveIntegrationConfig(prismaProvider, { feedUrl, apiToken, priceDivisor });
  await prisma.storeIntegration.update({
    where: { provider: prismaProvider },
    data: {
      accountId: null,
      accountLabel: null,
      connectedAt: null,
      tokenExpiresAt: null,
    },
  });
}

function stableSlug(
  provider: ExternalProviderName,
  product: ExternalProductData,
): string {
  const hash = createHash("sha256")
    .update(`${provider}:${product.externalId}`)
    .digest("hex")
    .slice(0, 12);
  const base = slugifyProduct(`${provider.toLowerCase()}-${product.name}`);
  return `${base.slice(0, 66)}-${hash}`;
}

async function importProducts(provider: ExternalProviderName) {
  const fetchedProducts = await getExternalProducts(provider);
  const uniqueProducts = Array.from(
    new Map(fetchedProducts.map((product) => [product.externalId, product])).values(),
  );
  const prismaProvider = ExternalProvider[provider];
  const existingMappings = new Map<
    string,
    Awaited<ReturnType<typeof prisma.externalProduct.findMany>>[number] & {
      product: { id: string; imageUrl: string };
    }
  >();

  for (let offset = 0; offset < uniqueProducts.length; offset += 400) {
    const mappings = await prisma.externalProduct.findMany({
      where: {
        provider: prismaProvider,
        externalId: {
          in: uniqueProducts
            .slice(offset, offset + 400)
            .map(({ externalId }) => externalId),
        },
      },
      include: { product: { select: { id: true, imageUrl: true } } },
    });
    mappings.forEach((mapping) => existingMappings.set(mapping.externalId, mapping));
  }

  let created = 0;
  let updated = 0;
  const batchSize = 100;

  for (let offset = 0; offset < uniqueProducts.length; offset += batchSize) {
    const batch = uniqueProducts.slice(offset, offset + batchSize);
    await prisma.$transaction(
      batch.map((product) => {
        const mapping = existingMappings.get(product.externalId);
        if (mapping) {
          updated += 1;
          const imageUrl =
            isProductImagePlaceholder(mapping.product.imageUrl) &&
            !isProductImagePlaceholder(product.imageUrl)
              ? product.imageUrl
              : mapping.product.imageUrl;
          return prisma.product.update({
            where: { id: mapping.productId },
            data: {
              name: product.name,
              description: product.description,
              price: product.price,
              imageUrl,
              category: product.category,
              ageGroup: product.ageGroup,
              gender: product.gender,
              stock: product.stock,
              isActive: true,
            },
          });
        }

        created += 1;
        return prisma.product.create({
          data: {
            name: product.name,
            slug: stableSlug(provider, product),
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl || PRODUCT_IMAGE_PLACEHOLDER,
            category: product.category,
            ageGroup: product.ageGroup,
            gender: product.gender,
            stock: product.stock,
            externalProducts: {
              create: { provider: prismaProvider, externalId: product.externalId },
            },
          },
        });
      }),
    );
  }

  return { total: uniqueProducts.length, created, updated };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);

  try {
    const integrations = await Promise.all(
      EXTERNAL_PROVIDERS.map(async (provider) => ({
        ...(await getIntegrationStatus(provider)),
        settings: await publicSettings(provider, request.nextUrl.origin),
      })),
    );
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Reading store integration settings failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse("خواندن تنظیمات اتصال ناموفق بود", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return errorResponse("Unauthorized", 401);
  if (!hasSameOrigin(request)) return errorResponse("مبدأ درخواست معتبر نیست", 403);

  let body: { provider?: unknown; action?: unknown; settings?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse("درخواست نامعتبر است", 400);
  }
  if (!isProvider(body.provider)) return errorResponse("سرویس انتخاب‌شده معتبر نیست", 400);
  if (!["save", "connect", "disconnect", "import"].includes(String(body.action))) {
    return errorResponse("عملیات انتخاب‌شده معتبر نیست", 400);
  }

  const provider = body.provider;
  const action = body.action as IntegrationAction;
  try {
    if (action === "save") {
      await saveSettings(provider, body.settings);
      return NextResponse.json({
        integration: {
          ...(await getIntegrationStatus(provider)),
          settings: await publicSettings(provider, request.nextUrl.origin),
        },
        message: "تنظیمات با موفقیت و به‌صورت رمزگذاری‌شده ذخیره شد",
      });
    }

    if (action === "disconnect") {
      await disconnectIntegration(ExternalProvider[provider]);
      return NextResponse.json({
        integration: {
          ...(await getIntegrationStatus(provider)),
          settings: await publicSettings(provider, request.nextUrl.origin),
        },
        message: `اتصال ${provider === "INSTAGRAM" ? "Instagram" : provider === "TOROB" ? "ترب" : "دیجی‌کالا"} قطع شد`,
      });
    }

    if (action === "connect" && provider === "INSTAGRAM") {
      const config = await getIntegrationConfig<InstagramIntegrationConfig>(
        ExternalProvider.INSTAGRAM,
      );
      if (!config?.appId || !config.appSecret) {
        return errorResponse("ابتدا تنظیم اولیه Instagram را تکمیل کنید", 422);
      }
      const state = randomBytes(32).toString("base64url");
      const authorizationUrl = createInstagramAuthorizationUrl({
        appId: config.appId,
        redirectUri: instagramCallbackUrl(request.nextUrl.origin),
        state,
      });
      const response = NextResponse.json({ authorizationUrl });
      response.cookies.set(INSTAGRAM_OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: INSTAGRAM_OAUTH_STATE_MAX_AGE,
      });
      return response;
    }

    if (action === "connect") {
      const integration = await checkIntegration(provider);
      return NextResponse.json(
        {
          integration: {
            ...integration,
            settings: await publicSettings(provider, request.nextUrl.origin),
          },
        },
        { status: integration.connected ? 200 : 422 },
      );
    }

    const connection = await checkIntegration(provider);
    if (!connection.connected) {
      return NextResponse.json({ error: connection.message, integration: connection }, { status: 422 });
    }
    const summary = await importProducts(provider);
    return NextResponse.json({
      ok: true,
      integration: connection,
      summary,
      message: `${summary.total.toLocaleString("fa-IR")} کالا دریافت شد؛ ${summary.created.toLocaleString("fa-IR")} جدید و ${summary.updated.toLocaleString("fa-IR")} به‌روزرسانی شد`,
    });
  } catch (error) {
    console.error("Store integration action failed", {
      provider,
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return errorResponse(
      error instanceof Error ? error.message : "عملیات اتصال ناموفق بود",
      action === "import" || action === "connect" ? 502 : 400,
    );
  }
}
