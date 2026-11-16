import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("removes inherited legacy explicit browser grants and keeps internal billing executable by service_role",async()=>{
 const db=new PGlite();
 const signatures=[
 "apply_approved_mercadopago_payment(uuid,text,text,text,timestamptz,integer)",
 "apply_approved_prepaid_payment(uuid,text,text,text,timestamptz,integer)",
 "rebuild_mercadopago_access_ledger(uuid,uuid,timestamptz)",
 "recalculate_mercadopago_access_after_reversal(uuid,text,text,text)",
 "reserve_mercadopago_checkout(uuid,text,uuid,text,timestamptz,jsonb)"];
 try {
  await db.exec(readFileSync("server/billing/tests/referralBootstrap.sql","utf8"));
  for(const file of readdirSync("supabase/migrations").sort().filter(f=>/^(20260718|20260728|202608280001|20260906|20260907|20260908)/.test(f)))await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
  await db.exec("alter table billing_plans add column if not exists requires_legacy_founder_eligibility boolean not null default false; create table billing_user_entitlements(id uuid default gen_random_uuid(),user_id uuid,entitlement_key text);");
  for(const file of ["202610280001_billing_plan_duration_configuration.sql","202610280002_prepaid_checkout_recovery.sql"])await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
  for(const s of signatures) await db.exec(`grant execute on function public.${s} to anon, authenticated`);
  const before=await db.query("select oid,prosrc from pg_proc where oid=any($1::oid[])",[await Promise.all(signatures.map(async s=>(await db.query<any>("select to_regprocedure($1)::oid as id",["public."+s])).rows[0].id))]);
  const sql=readFileSync("supabase/migrations/202610290004_restrict_internal_billing_execution.sql","utf8");
  await db.exec(sql);await db.exec(sql); // permission-only retry is safe
  for(const s of signatures){
   const rows=await db.query<any>("select has_function_privilege('anon',$1,'EXECUTE') as anon,has_function_privilege('authenticated',$1,'EXECUTE') as authenticated,has_function_privilege('service_role',$1,'EXECUTE') as service",["public."+s]);
   expect(rows.rows[0]).toEqual({anon:false,authenticated:false,service:true});
   for(const role of ["anon","authenticated"]){
    await db.exec(`set role ${role}`);
    const args=s.slice(s.indexOf('(')+1,-1).split(',').map(t=>`null::${t}`).join(',');
    await expect(db.query(`select * from public.${s.split('(')[0]}(${args})`)).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
   }
  }
  for(const row of before.rows as any[])expect((await db.query<any>("select prosrc from pg_proc where oid=$1",[row.oid])).rows[0].prosrc).toBe(row.prosrc);
 }finally{await db.close();}
},30000);
