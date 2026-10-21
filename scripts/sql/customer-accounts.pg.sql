-- Additive customer accounts, secure sessions and shipping snapshots.
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "mobile" TEXT NOT NULL UNIQUE,
  "nationalIdDigest" TEXT NOT NULL UNIQUE,
  "nationalIdLast4" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "email" TEXT,
  "avatarUrl" TEXT,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "postalCode" TEXT,
  "address" TEXT,
  "failedLogins" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "CustomerSession" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CustomerSession_customerId_idx" ON "CustomerSession" ("customerId");
CREATE INDEX IF NOT EXISTS "CustomerSession_expiresAt_idx" ON "CustomerSession" ("expiresAt");
CREATE TABLE IF NOT EXISTS "CustomerAuthThrottle" (
  "id" TEXT PRIMARY KEY,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "windowEnds" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientIsOther" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientPhone" TEXT;
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order" ("customerId");
-- Apply the FK idempotently.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_customerId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
