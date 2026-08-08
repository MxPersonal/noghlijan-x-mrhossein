-- CreateTable
CREATE TABLE "StoreIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "encryptedConfig" TEXT NOT NULL,
    "accountId" TEXT,
    "accountLabel" TEXT,
    "connectedAt" DATETIME,
    "tokenExpiresAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreIntegration_provider_key" ON "StoreIntegration"("provider");
