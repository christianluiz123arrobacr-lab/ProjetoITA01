import { afterEach,describe,expect,it,vi } from "vitest";
import { recoverPrepaidResource, createPixPayment } from "./mercadoPagoClient";
import { runPrepaidCheckout } from "./prepaidCheckout";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});

describe("Pix expiration serialization (mock HTTP, no provider calls)",()=>{
 const pix={externalReference:"ref",payerEmail:"synthetic@example.test",amount:8.1,
  description:"Synthetic",notificationUrl:"https://example.test/hook",idempotencyKey:"same-key"};
 it.each([
  ["2026-11-02T23:01:21.188477+00:00","2026-11-02T23:01:21.188+00:00"],
  ["2026-11-02T20:01:21.188477-03:00","2026-11-02T23:01:21.188+00:00"],
  ["2026-11-02T23:01:21.188Z","2026-11-02T23:01:21.188+00:00"],
  ["2026-11-02T23:01:21Z","2026-11-02T23:01:21.000+00:00"],
 ])("normalizes %s without extending the frozen deadline",async(expiresAt,expected)=>{
  vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:12})));
  vi.stubGlobal("fetch",fetcher);
  await createPixPayment({...pix,expiresAt});
  const request=fetcher.mock.calls[0][1];
  expect(JSON.parse(request.body)).toEqual({transaction_amount:8.1,description:pix.description,
   payment_method_id:"pix",payer:{email:pix.payerEmail},external_reference:"ref",
   notification_url:pix.notificationUrl,date_of_expiration:expected});
  expect(Date.parse(expected)).toBe(Date.parse(expiresAt));
  expect(new Headers(request.headers).get("X-Idempotency-Key")).toBe("same-key");
 });
 it.each(["invalid","2026-11-02T23:01:21","2026-99-99T23:01:21Z"])("rejects malformed or timezone-less expiry before HTTP: %s",async expiresAt=>{
  const fetcher=vi.fn();vi.stubGlobal("fetch",fetcher);
  await expect(createPixPayment({...pix,expiresAt})).rejects.toMatchObject({category:"invalid_expiration"});
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("first submission and recovery send identical normalized bodies and keys after a lost response",async()=>{
  vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN","synthetic-test-only");
  const fetcher=vi.fn().mockRejectedValueOnce(new TypeError("response lost"))
   .mockResolvedValueOnce(new Response(JSON.stringify({id:12,external_reference:"payment:p:subscription:s",
    transaction_amount:8.1,currency_id:"BRL",point_of_interaction:{transaction_data:{ticket_url:"https://example.test/pix"}}})));
  vi.stubGlobal("fetch",fetcher);
  let submitted=false;
  const attempt={id:"a",payment_id:"p",months:1,state:"submitted",snapshot:{subscription_id:"s",
   payer_email:pix.payerEmail,total_cents:810,title:"Normal",expires_at:"2099-11-02T23:01:21.188477+00:00"}};
  const rpc=vi.fn(async(name:string,args:any)=>{
   if(name==="prepare_prepaid_checkout")return attempt;
   if(name==="claim_prepaid_submission"){const claimed=!submitted;submitted=true;return claimed;}
   return args.p_result;
  });
  const deps={rpc,createPix:createPixPayment,createCard:vi.fn(),recover:vi.fn(async()=>null),
   syncPayment:vi.fn(),notificationUrl:pix.notificationUrl,backUrl:"https://example.test/back"};
  const input={userId:"u",userEmail:pix.payerEmail,planSlug:"normal",durationMonths:1 as const,paymentMethod:"pix" as const,attemptKey:"original"};
  await expect(runPrepaidCheckout(input,deps)).rejects.toMatchObject({code:"SERVICE_UNAVAILABLE"});
  expect((await runPrepaidCheckout(input,deps)).providerResourceId).toBe("12");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
  expect(JSON.parse(fetcher.mock.calls[1][1].body).date_of_expiration).toBe("2099-11-02T23:01:21.188+00:00");
  for(const call of fetcher.mock.calls)expect(new Headers(call[1].headers).get("X-Idempotency-Key")).toBe("mp-prepaid-p");
  expect(attempt.snapshot.expires_at).toBe("2099-11-02T23:01:21.188477+00:00");
 });
});
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
