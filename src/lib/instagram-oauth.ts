import "server-only";

import type { InstagramIntegrationConfig } from "@/lib/integration-settings";

export const INSTAGRAM_OAUTH_STATE_COOKIE = "clothe_instagram_oauth_state";
export const INSTAGRAM_OAUTH_STATE_MAX_AGE = 10 * 60;

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_TOKEN_RESPONSE_BYTES = 64 * 1024;

type TokenResponse = {
  access_token?: unknown;
  user_id?: unknown;
  expires_in?: unknown;
};

function requiredString(value: unknown, errorMessage: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(errorMessage);
  return value.trim();
}

async function readJsonResponse(response: Response): Promise<TokenResponse> {
  if (!response.ok) {
    throw new Error(`Instagram پاسخ ${response.status} داد`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_TOKEN_RESPONSE_BYTES) {
    throw new Error("پاسخ Instagram بیش از حد بزرگ است");
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer)) as TokenResponse;
  } catch {
    throw new Error("پاسخ ورود Instagram معتبر نیست");
  }
}

export function instagramCallbackUrl(origin: string): string {
  return new URL(
    "/api/admin/integrations/instagram/callback",
    origin,
  ).toString();
}

export function createInstagramAuthorizationUrl(input: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "instagram_business_basic");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export async function exchangeInstagramAuthorizationCode(input: {
  config: InstagramIntegrationConfig;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; userId: string; expiresAt?: Date }> {
  const form = new URLSearchParams({
    client_id: input.config.appId,
    client_secret: input.config.appSecret,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: input.code,
  });
  const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const shortToken = await readJsonResponse(shortResponse);
  const shortAccessToken = requiredString(
    shortToken.access_token,
    "Instagram توکن دسترسی برنگرداند",
  );
  const userId = requiredString(
    shortToken.user_id,
    "Instagram شناسه حساب برنگرداند",
  );

  const longLivedUrl = new URL("https://graph.instagram.com/access_token");
  longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
  longLivedUrl.searchParams.set("client_secret", input.config.appSecret);
  longLivedUrl.searchParams.set("access_token", shortAccessToken);
  const longResponse = await fetch(longLivedUrl, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const longToken = await readJsonResponse(longResponse);
  const accessToken = requiredString(
    longToken.access_token,
    "Instagram توکن بلندمدت برنگرداند",
  );
  const expiresIn = Number(longToken.expires_in);
  const expiresAt =
    Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

  return { accessToken, userId, expiresAt };
}
