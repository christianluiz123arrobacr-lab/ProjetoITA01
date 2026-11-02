import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const { PGlite } = await import(
  pathToFileURL(
    resolve("tmp/referral-sql/node_modules/@electric-sql/pglite/dist/index.js")
  ).href
);
export async function createReferralTestDatabase() {
  const db = new PGlite();
  await db.exec(
    readFileSync("server/billing/tests/referralBootstrap.sql", "utf8")
  );
  for (const file of readdirSync("supabase/migrations")
    .sort()
    .filter(
      f =>
        f.startsWith("20260718") ||
        f.startsWith("20260728") ||
        f.startsWith("202608280001") ||
        f.startsWith("20260906") ||
        f.startsWith("20260907") ||
        f.startsWith("20260908")
    )) {
    try {
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file}: ${error.message}`, { cause: error });
    }
  }
  return db;
}
if (process.argv[1]?.endsWith("referralDatabase.mjs")) {
  const db = await createReferralTestDatabase();
  console.log("Migrations SQL aplicadas no PostgreSQL local em memória.");
  await db.close();
}
