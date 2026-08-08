import { NextRequest, NextResponse } from "next/server";
import { ExternalProvider } from "@/generated/prisma/enums";
import { isAdminAuthenticated } from "@/lib/admin";
import { checkIntegration } from "@/lib/external-integrations";
import {
  exchangeInstagramAuthorizationCode,
  instagramCallbackUrl,
  INSTAGRAM_OAUTH_STATE_COOKIE,
} from "@/lib/instagram-oauth";
import {
  getIntegrationConfig,
  markIntegrationConnected,
  saveIntegrationConfig,
  type InstagramIntegrationConfig,
} from "@/lib/integration-settings";

export const runtime = "nodejs";

function adminRedirect(request: NextRequest, result: string): NextResponse {
  const url = new URL("/admin", request.nextUrl.origin);
  url.searchParams.set("integration", result);
  const response = NextResponse.redirect(url);
  response.cookies.set(INSTAGRAM_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return adminRedirect(request, "instagram-auth-required");
  }

  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expectedState = request.cookies.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (!state || !expectedState || state !== expectedState || !code) {
    return adminRedirect(request, "instagram-invalid-callback");
  }

  try {
    const config = await getIntegrationConfig<InstagramIntegrationConfig>(
      ExternalProvider.INSTAGRAM,
    );
    if (!config?.appId || !config.appSecret) {
      return adminRedirect(request, "instagram-setup-required");
    }

    const token = await exchangeInstagramAuthorizationCode({
      config,
      code,
      redirectUri: instagramCallbackUrl(request.nextUrl.origin),
    });
    await saveIntegrationConfig(ExternalProvider.INSTAGRAM, {
      appId: config.appId,
      appSecret: config.appSecret,
      accessToken: token.accessToken,
      userId: token.userId,
    });
    const checked = await checkIntegration("INSTAGRAM");
    if (!checked.connected) {
      return adminRedirect(request, "instagram-check-failed");
    }
    await markIntegrationConnected(ExternalProvider.INSTAGRAM, {
      accountId: token.userId,
      accountLabel: checked.accountLabel,
      tokenExpiresAt: token.expiresAt,
    });
    return adminRedirect(request, "instagram-connected");
  } catch (error) {
    console.error("Instagram OAuth callback failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return adminRedirect(request, "instagram-failed");
  }
}
