-- PostgreSQL migration for independent purchasable product variants.
-- Additive only: existing products and orders remain intact.
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "colorName" TEXT,
  "colorHex" TEXT,
  "size" TEXT,
  "attributes" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "price" INTEGER,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "sku" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_sortOrder_idx" ON "ProductVariant" ("productId", "sortOrder");
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;
