import "server-only";

import { ExternalProvider } from "@/generated/prisma/enums";
import { decryptJson, encryptJson } from "@/lib/encrypted-storage";
import { prisma } from "@/lib/prisma";

export type FeedIntegrationConfig = {
  feedUrl: string;
  apiToken: string;
  priceDivisor: number;
};

export type InstagramIntegrationConfig = {
  appId: string;
  appSecret: string;
  accessToken?: string;
  userId?: string;
};

export type IntegrationConfig =
  | FeedIntegrationConfig
  | InstagramIntegrationConfig;

export async function getIntegrationConfig<T extends IntegrationConfig>(
  provider: ExternalProvider,
): Promise<T | null> {
  const integration = await prisma.storeIntegration.findUnique({
    where: { provider },
    select: { encryptedConfig: true },
  });
  if (!integration) return null;
  return decryptJson<T>(integration.encryptedConfig);
}

export async function saveIntegrationConfig(
  provider: ExternalProvider,
  config: IntegrationConfig,
): Promise<void> {
  const encryptedConfig = await encryptJson(config);
  await prisma.storeIntegration.upsert({
    where: { provider },
    create: { provider, encryptedConfig },
    update: {
      encryptedConfig,
      lastError: null,
    },
  });
}

export async function markIntegrationConnected(
  provider: ExternalProvider,
  data: {
    accountId?: string;
    accountLabel?: string;
    tokenExpiresAt?: Date;
  },
): Promise<void> {
  await prisma.storeIntegration.update({
    where: { provider },
    data: {
      accountId: data.accountId,
      accountLabel: data.accountLabel,
      tokenExpiresAt: data.tokenExpiresAt,
      connectedAt: new Date(),
      lastError: null,
    },
  });
}

export async function markIntegrationError(
  provider: ExternalProvider,
  message: string,
): Promise<void> {
  await prisma.storeIntegration.updateMany({
    where: { provider },
    data: {
      connectedAt: null,
      lastError: message.slice(0, 500),
    },
  });
}

export async function disconnectIntegration(
  provider: ExternalProvider,
): Promise<void> {
  const integration = await prisma.storeIntegration.findUnique({
    where: { provider },
    select: { encryptedConfig: true },
  });
  if (!integration) return;

  const current = await decryptJson<IntegrationConfig>(
    integration.encryptedConfig,
  );
  const disconnected =
    provider === ExternalProvider.INSTAGRAM
      ? {
          appId: (current as InstagramIntegrationConfig).appId,
          appSecret: (current as InstagramIntegrationConfig).appSecret,
        }
      : current;

  await prisma.storeIntegration.update({
    where: { provider },
    data: {
      encryptedConfig: await encryptJson(disconnected),
      accountId: null,
      accountLabel: null,
      connectedAt: null,
      tokenExpiresAt: null,
      lastError: null,
    },
  });
}
