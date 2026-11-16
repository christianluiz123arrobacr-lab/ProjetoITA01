import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { calculateDurationPrice, durationConfigSchema } from "../../shared/planDurations";

describe("preparation of plan durations", () => {
  it.each([[1,0,1190],[2,500,2261],[3,500,3391],[6,500,6783],[12,0,14280]])("prices %s calendar months in cents", (months,bps,total) => {
    expect(calculateDurationPrice(1190,months,bps).totalCents).toBe(total);
  });
  it("rounds half a cent once on the whole package", () => {
    expect(calculateDurationPrice(101,1,5000)).toMatchObject({ subtotalCents:101, discountCents:51, totalCents:50 });
    expect(() => calculateDurationPrice(2147483647,12,0)).toThrow();
    expect(() => calculateDurationPrice(10.1,1,0)).toThrow();
    expect(() => calculateDurationPrice(100,4,0)).toThrow();
  });
  it("rejects prices and final amounts from the browser", () => {
    const input = { planId: "11111111-1111-4111-8111-111111111111", months:6, enabled:false, discountBps:500, expectedRevision:0 };
    expect(durationConfigSchema.safeParse(input).success).toBe(true);
    expect(durationConfigSchema.safeParse({...input, amountCents:1}).success).toBe(false);
    expect(durationConfigSchema.safeParse({...input, discountBps:10000}).success).toBe(false);
  });
  it("applies SQL atomically, enforces profile authorization and stale revision, then rolls back", async () => {
    const db = new PGlite();
    try {
      await db.exec(`create role anon; create role authenticated; create role service_role;
        create table profiles(id uuid primary key, role text, ativo boolean);
        create table billing_plans(id uuid primary key);
        insert into profiles values('11111111-1111-4111-8111-111111111111','admin',true),('22222222-2222-4222-8222-222222222222','editor',true),('33333333-3333-4333-8333-333333333333','student',true);
        insert into billing_plans values('11111111-1111-4111-8111-111111111111');`);
      await db.exec(readFileSync("supabase/migrations/202610280001_billing_plan_duration_configuration.sql","utf8"));
      const save = (actor:string,revision:number) => db.query(`select save_billing_plan_duration($1,'11111111-1111-4111-8111-111111111111',6,false,500,$2)`,[actor,revision]);
      await expect(save("22222222-2222-4222-8222-222222222222",0)).rejects.toThrow("Administrator required");
      await expect(save("33333333-3333-4333-8333-333333333333",0)).rejects.toThrow("Administrator required");
      await save("11111111-1111-4111-8111-111111111111",0);
      await expect(save("11111111-1111-4111-8111-111111111111",0)).rejects.toThrow("Configuration changed");
      await save("11111111-1111-4111-8111-111111111111",1);
      const result = await db.query<{revision:number;enabled:boolean}>("select revision, enabled from billing_plan_durations");
      expect(result.rows).toEqual([{revision:2,enabled:false}]);
      await db.exec("set role authenticated");
      await expect(db.query("select * from billing_plan_durations")).rejects.toThrow();
      await expect(save("11111111-1111-4111-8111-111111111111",2)).rejects.toThrow();
      await db.exec("reset role");
      await db.exec(readFileSync("supabase/rollbacks/202610280001_billing_plan_duration_configuration.rollback.sql","utf8"));
      expect((await db.query("select to_regclass('public.billing_plan_durations') as table_name")).rows).toEqual([{table_name:null}]);
    } finally { await db.close(); }
  },30000);
});
