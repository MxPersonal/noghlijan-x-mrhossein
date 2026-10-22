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
  const pageMigration = new URL("./sql/site-content.pg.sql", import.meta.url);
  await client.query(await readFile(pageMigration, "utf8"));
  const customerMigration = new URL("./sql/customer-accounts.pg.sql", import.meta.url);
  await client.query(await readFile(customerMigration, "utf8"));
  const gatewaysMigration = new URL("./sql/payment-methods.pg.sql", import.meta.url);
  await client.query(await readFile(gatewaysMigration, "utf8"));
  await client.query("COMMIT");
  console.log("Product variants, content, customer accounts, and payment-method columns are ready.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("Product-variant database migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
