import { afterEach,describe,expect,it,vi } from "vitest";
import { recoverPrepaidResource } from "./mercadoPagoClient";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
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
 await expect(recoverPrepaidResource("card","ref")).rejects.toThrow("revisão");
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
