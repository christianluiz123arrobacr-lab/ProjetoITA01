import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const diagnostic = readFileSync("supabase/diagnostics/202610290002_billing_stages_publication_preflight.sql", "utf8");
async function read(db: PGlite) {
  await db.exec("begin read only");
  try { return (await db.query<any>(diagnostic)).rows[0].publication_diagnostic; }
  finally { await db.exec("rollback"); }
}
it("reports absent objects in a read-only transaction without requiring stage tables", async()=>{
  const db=new PGlite();
  try {
    const result=await read(db);
    expect(result.tables.every((t:any)=>!t.present)).toBe(true);
    expect(result.stage_functions.every((f:any)=>!f.present)).toBe(true);
  } finally {await db.close();}
});
it("recognizes the exact local stage functions using catalog reads only",async()=>{
  const db=new PGlite();
  try {
    await db.exec(readFileSync("server/billing/tests/referralBootstrap.sql","utf8"));
    for(const file of readdirSync("supabase/migrations").sort().filter(f=>/^(20260718|20260728|202608280001|20260906|20260907|20260908)/.test(f))) await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
    await db.exec("alter table billing_plans add column if not exists requires_legacy_founder_eligibility boolean not null default false; create table billing_user_entitlements(id uuid default gen_random_uuid(),user_id uuid,entitlement_key text);");
    for(const file of ["202610280001_billing_plan_duration_configuration.sql","202610280002_prepaid_checkout_recovery.sql","202610290001_affiliate_program.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
    const result=await read(db);
    expect(result.tables.filter((t:any)=>t.stage!=="dependency").every((t:any)=>t.present&&t.rls)).toBe(true);
    expect(result.stage_functions).toHaveLength(11);
    expect(result.stage_functions.every((f:any)=>f.present&&f.body_matches_local)).toBe(true);
  } finally {await db.close();}
},30000);
