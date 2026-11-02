import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc:vi.fn(), read:vi.fn() }));
vi.mock("../_core/context.js", () => ({ ensureAuthentication:vi.fn(), assertAuthenticationAvailable:vi.fn() }));
vi.mock("../_core/supabaseAdmin.js", () => ({ supabaseAdmin: { rpc:mocks.rpc } }));
vi.mock("../_core/databaseRead.js", () => ({ readAllDatabaseRows:mocks.read }));
import { planDurationsRouter } from "./planDurations";
const id = "11111111-1111-4111-8111-111111111111";
const caller = (role: string | null) => planDurationsRouter.createCaller({user:role ? {id,role}:null} as any);
const input = {planId:id,months:6 as const,enabled:false,discountBps:500,expectedRevision:0};
beforeEach(() => vi.resetAllMocks());
describe("duration configuration authorization and server prices", () => {
  it.each([null,"student","editor"])("blocks %s before reading or saving", async role => {
    await expect(caller(role).list()).rejects.toMatchObject({code:"FORBIDDEN"});
    await expect(caller(role).save(input)).rejects.toMatchObject({code:"FORBIDDEN"});
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("defaults every new configuration off and computes from stored base price", async () => {
    mocks.read.mockResolvedValueOnce([{id,name:"Normal",slug:"normal",price_cents:1190,currency:"BRL"}]).mockResolvedValueOnce([]);
    const result = await caller("admin").list();
    expect(result[0].checkoutActive).toBe(true);
    expect(result[0].durations.map(row => row.months)).toEqual([1,2,3,6,12]);
    expect(result[0].durations.map(row=>row.enabled)).toEqual([true,true,true,false,false]);
    expect(result[0].durations[3].price?.totalCents).toBe(6783);
  });
  it("rejects client financial totals without executing SQL", async () => {
    await expect(caller("admin").save({...input,totalCents:1} as any)).rejects.toMatchObject({code:"BAD_REQUEST"});
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("passes authenticated actor and revision, and reports stale writes", async () => {
    mocks.rpc.mockResolvedValue({data:null,error:{code:"40001"}});
    await expect(caller("admin").save(input)).rejects.toMatchObject({code:"CONFLICT"});
    expect(mocks.rpc).toHaveBeenCalledWith("save_billing_plan_duration",expect.objectContaining({p_actor:id,p_expected_revision:0}));
  });
  it("does not treat unavailable configuration as an empty catalog", async () => {
    mocks.read.mockRejectedValue(new Error("unavailable"));
    await expect(caller("admin").list()).rejects.toThrow();
  });
});
