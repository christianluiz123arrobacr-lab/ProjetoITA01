import { afterEach,describe,expect,it,vi } from "vitest";
import { recoverPrepaidResource, createPixPayment } from "./mercadoPagoClient";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each([
 [{message:"Invalid date_of_expiration: private@example.test",cause:[{code:23,description:"private token",data:"private secret"},{code:"private-token"}]},{codes:["23"],fields:["date_of_expiration"],reason:"unclassified"}],
 [{message:"Collector user without key enabled for QR render",cause:[]},{codes:[],fields:[],reason:"collector_pix_not_enabled"}],
])("retains safe diagnostics from a rejected Pix without raw provider text",async(body,diagnostics)=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify(body),{status:400})));
 const error = await createPixPayment({externalReference:"ref",payerEmail:"synthetic@example.test",amount:8.1,
  description:"Synthetic",notificationUrl:"https://example.test/hook",expiresAt:"2026-12-01T00:00:00Z",idempotencyKey:"same-key"})
  .then(()=>null,(error)=>error);
 expect(error).toMatchObject({status:400});expect(error.diagnostics).toEqual(diagnostics);
 expect(JSON.stringify(error.diagnostics)).not.toMatch(/private|secret|token|@/);
});
describe("official prepaid provider lookup (mock HTTP)",()=>{
 it("gets original preference after exact external-reference search",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({elements:[{id:"original"}],total:1})))
 .mockResolvedValueOnce(new Response(JSON.stringify({id:"original",external_reference:"ref",init_point:"https://www.mercadopago.com.br/pay"})));
 vi.stubGlobal("fetch",fetcher);expect((await recoverPrepaidResource("card","ref"))?.id).toBe("original");
 expect(fetcher.mock.calls[0][0]).toContain("/checkout/preferences/search?external_reference=ref");
 expect(fetcher.mock.calls[1][0]).toContain("/checkout/preferences/original");
 expect(fetcher.mock.calls.every(call=>!call[1].method||call[1].method==="GET")).toBe(true);
 });
 it("does not choose silently when preference total exceeds returned page",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({elements:[{id:"a"}],total:2}))));
 await expect(recoverPrepaidResource("card","ref")).rejects.toMatchObject({category:"multiple_results",operation:"search"});
 });
 it("returns null for an empty search without issuing POST",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({results:[],paging:{total:0}})));vi.stubGlobal("fetch",fetcher);
 expect(await recoverPrepaidResource("pix","ref")).toBeNull();expect(fetcher).toHaveBeenCalledOnce();
 });
 it("fetches payment details rather than trusting partial search fields",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({results:[{id:12}],paging:{total:1}}))).mockResolvedValueOnce(new Response(JSON.stringify({id:12,status:"pending",external_reference:"ref"})));vi.stubGlobal("fetch",fetcher);
 expect((await recoverPrepaidResource("pix","ref"))?.status).toBe("pending");expect(fetcher.mock.calls[1][0]).toContain("/v1/payments/12");
 });
});

it("preserves HTTP status and safe provider trace on non-JSON failures",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("private upstream body",{status:503,headers:{"x-request-id":"safe-trace"}})));
 await expect(recoverPrepaidResource("pix","ref")).rejects.toMatchObject({operation:"search",cause:{status:503,requestId:"safe-trace"}});
});
it("marks a failure in resource lookup separately from search",async()=>{
 vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({results:[{id:12}],paging:{total:1}}))).mockResolvedValueOnce(new Response("{}",{status:401})));
 await expect(recoverPrepaidResource("pix","ref")).rejects.toMatchObject({operation:"get_resource",cause:{status:401}});
});
