-- Non-destructive payment-provider metadata for existing orders.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentUsdAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentReviewReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Order_paymentProvider_idx" ON "Order" ("paymentProvider");
CREATE INDEX IF NOT EXISTS "Order_authority_provider_idx" ON "Order" ("authority", "paymentProvider");
