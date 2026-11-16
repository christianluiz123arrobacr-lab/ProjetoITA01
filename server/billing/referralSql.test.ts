import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, it } from "vitest";
const installed = existsSync(
  "tmp/referral-sql/node_modules/@electric-sql/pglite/dist/index.js"
);
it.skipIf(!installed)(
  "executa as migrations, invariantes, RLS e rollback em PostgreSQL local",
  async () => {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ["server/billing/tests/runReferralSqlTests.mjs"],
      { maxBuffer: 2 * 1024 * 1024 }
    );
    expect(stdout).toContain("verificações concluídas");
  },
  60000
);
