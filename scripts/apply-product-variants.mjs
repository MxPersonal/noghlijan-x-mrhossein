// Safe, additive PostgreSQL migration. Idempotent and non-destructive.
// Existing SQLite-era Prisma migrations do not describe the production Postgres schema.
import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required for the additive product-variant migration.");
  process.exit(1);
}
const client = new pg.Client({ connectionString });
try {
  await client.connect();
  const migration = new URL("./sql/product-variants.pg.sql", import.meta.url);
  const sql = await readFile(migration, "utf8");
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("Product variant tables/columns are ready.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("Product-variant database migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
