-- CreateTable
CREATE TABLE "ExternalProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExternalProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExternalProduct_productId_idx" ON "ExternalProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalProduct_provider_externalId_key" ON "ExternalProduct"("provider", "externalId");
