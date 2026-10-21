-- Additive, idempotent PostgreSQL table for editable public pages.
-- Stores only explicitly admin-edited public content; no existing rows are changed.
CREATE TABLE IF NOT EXISTS "SiteContent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
