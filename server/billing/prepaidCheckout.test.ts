import { describe,expect,it,vi } from "vitest";
import { runPrepaidCheckout,type PrepaidInput } from "./prepaidCheckout";
import { prepaidCheckoutSchema } from "../../shared/planDurations";
const input:PrepaidInput={userId:"user",userEmail:"synthetic@example.test",planSlug:"normal",durationMonths:6,paymentMethod:"pix",attemptKey:"key"};
function scenario(){
 const a={id:"a",payment_id:"p",months:6,state:"prepared",snapshot:{subscription_id:"s",payer_email:input.userEmail,total_cents:6783,title:"Normal",expires_at:"2026-12-01T00:00:00Z"},result:null as any};
 let external:any=null,failSave=false;
 const resource={id:"mp",external_reference:"payment:p:subscription:s",currency_id:"BRL",transaction_amount:67.83,point_of_interaction:{transaction_data:{ticket_url:"https://www.mercadopago.com.br/pay"}}};
 const deps={notificationUrl:"https://example.test/webhook",backUrl:"https://example.test/back",rpc:vi.fn(async(name:string,args:any)=>{
   if(name==="prepare_prepaid_checkout")return structuredClone(a);
   if(name==="claim_prepaid_submission"){if(a.state!=="prepared")return false;a.state="submitted";return true;}
   if(failSave)throw Error("database response lost");
   if(a.state==="ready")return a.result;
   a.state="ready";a.result=args.p_result;return a.result;
 }),syncPayment:vi.fn(async()=>"pending"),recover:vi.fn(async()=>external),createPix:vi.fn(async()=>{external=resource;return resource;}),createCard:vi.fn()};
 return {a,deps,resource,setFailSave:(v:boolean)=>failSave=v,setExternal:(v:any)=>external=v};
}
describe("prepaid cross-boundary recovery (simulated concurrency, not native MVCC)",()=>{
 it("requires a stable identity and rejects browser supplied prices",()=>{
 const valid={planSlug:"normal",durationMonths:12,paymentMethod:"pix",attemptKey:"11111111-1111-4111-8111-111111111111"};
 expect(prepaidCheckoutSchema.safeParse(valid).success).toBe(true);
 expect(prepaidCheckoutSchema.safeParse({...valid,amountCents:1}).success).toBe(false);
 expect(prepaidCheckoutSchema.safeParse({...valid,attemptKey:undefined}).success).toBe(false);
 });
 it("freezes coupon identity and keeps the server gate out of browser control",async()=>{
 const s=scenario();(s.a.snapshot as any).affiliate={code:"TEST"};const original=s.deps.rpc.getMockImplementation()!;
 s.deps.rpc.mockImplementation((name,args)=>original(name==="prepare_affiliate_prepaid_checkout"?"prepare_prepaid_checkout":name,args));
 await runPrepaidCheckout({...input,couponCode:"TEST"},s.deps);
 expect(s.deps.rpc).toHaveBeenCalledWith("prepare_affiliate_prepaid_checkout",expect.objectContaining({p_coupon:"TEST",p_backend_enabled:false}));
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({code:"CONFLICT"});expect(s.deps.createPix).toHaveBeenCalledOnce();
 });
 it("concurrent calls can submit once and all retries converge",async()=>{
 const {deps}=scenario();const results=await Promise.allSettled(Array.from({length:10},()=>runPrepaidCheckout(input,deps)));
 expect(deps.createPix).toHaveBeenCalledTimes(1);expect(results.some(r=>r.status==="fulfilled")).toBe(true);
 const first=await runPrepaidCheckout(input,deps);expect((await runPrepaidCheckout(input,deps)).paymentId).toBe(first.paymentId);expect(deps.createPix).toHaveBeenCalledTimes(1);
 });
 it("lost network response after provider accepted uses GET, not another POST",async()=>{
 const s=scenario();s.deps.createPix.mockImplementation(async()=>{s.setExternal(s.resource);throw Error("timeout");});
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({code:"SERVICE_UNAVAILABLE"});
 expect((await runPrepaidCheckout(input,s.deps)).paymentId).toBe("p");expect(s.deps.createPix).toHaveBeenCalledTimes(1);
 });
 it("database failure after provider response preserves recovery identity",async()=>{
 const s=scenario();s.setFailSave(true);await expect(runPrepaidCheckout(input,s.deps)).rejects.toThrow();
 s.setFailSave(false);await runPrepaidCheckout(input,s.deps);expect(s.deps.createPix).toHaveBeenCalledTimes(1);
 });
 it("lost response after database commit returns the already confirmed result",async()=>{
 const s=scenario();const original=s.deps.rpc.getMockImplementation()!;let lost=true;
 s.deps.rpc.mockImplementation(async(name,args)=>{const result=await original(name,args);if(name==="complete_prepaid_submission"&&lost){lost=false;throw Error("response lost after commit");}return result;});
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toThrow();expect(s.a.state).toBe("ready");
 expect((await runPrepaidCheckout(input,s.deps)).paymentId).toBe("p");expect(s.deps.createPix).toHaveBeenCalledOnce();expect(s.deps.recover).not.toHaveBeenCalled();
 });
 it("replays a missing Pix with the same idempotency key and frozen request",async()=>{
 const s=scenario();s.a.state="submitted";
 const first=await runPrepaidCheckout(input,s.deps);
 expect(first.paymentId).toBe("p");
 expect(s.deps.recover).toHaveBeenCalledWith("pix","payment:p:subscription:s");
 expect(s.deps.createPix).toHaveBeenCalledOnce();
 expect(s.deps.createPix).toHaveBeenCalledWith(expect.objectContaining({
  externalReference:"payment:p:subscription:s",payerEmail:input.userEmail,amount:67.83,
  notificationUrl:"https://example.test/webhook",idempotencyKey:"mp-prepaid-p",
  description:"Normal — pacote de 6 meses",expiresAt:"2026-12-01T00:00:00Z",
 }));
 await runPrepaidCheckout(input,s.deps);
 expect(s.deps.createPix).toHaveBeenCalledOnce();
 });
 it("does not replay a Pix when the provider search itself fails",async()=>{
 const s=scenario();s.a.state="submitted";s.deps.recover.mockRejectedValue(new Error("provider unavailable"));
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({code:"SERVICE_UNAVAILABLE"});
 expect(s.deps.createPix).not.toHaveBeenCalled();
 });
 it("repeats identical Pix parameters after an accepted response is lost and search is empty",async()=>{
 const s=scenario();let accepted:any;
 s.deps.recover.mockResolvedValue(null);
 s.deps.createPix.mockImplementation(async(...args:any[])=>{
  if(!accepted){accepted=structuredClone(args[0]);throw Error("response lost");}
  expect(args[0]).toEqual(accepted);return s.resource;
 });
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({code:"SERVICE_UNAVAILABLE"});
 expect(s.a.state).toBe("submitted");
 expect((await runPrepaidCheckout(input,s.deps)).providerResourceId).toBe("mp");
 expect(s.deps.createPix).toHaveBeenCalledTimes(2);
 await runPrepaidCheckout(input,s.deps);expect(s.deps.createPix).toHaveBeenCalledTimes(2);
 });
 it.each(["2020-01-01T00:00:00Z","invalid"])("does not replay an expired or malformed expiry: %s",async expiresAt=>{
 const s=scenario();s.a.state="submitted";s.a.snapshot.expires_at=expiresAt;
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({cause:{category:"expired_unconfirmed_attempt"}});
 expect(s.deps.createPix).not.toHaveBeenCalled();expect(s.a.state).toBe("submitted");
 });
 it("keeps a card search miss blocked without replaying a preference",async()=>{
 const s=scenario();s.a.state="submitted";
 await expect(runPrepaidCheckout({...input,paymentMethod:"card"},s.deps)).rejects.toMatchObject({cause:{category:"search_empty"}});
 expect(s.deps.createCard).not.toHaveBeenCalled();
 });
 it("late provider response can finish while another recovery is pending",async()=>{
 const s=scenario();let finish!:()=>void;const gate=new Promise<void>(r=>finish=r);
 s.deps.createPix.mockImplementation(async()=>{await gate;s.setExternal(s.resource);return s.resource;});
 const first=runPrepaidCheckout(input,s.deps);await vi.waitFor(()=>expect(s.deps.createPix).toHaveBeenCalledOnce());
 const retry=runPrepaidCheckout(input,s.deps);await vi.waitFor(()=>expect(s.deps.createPix).toHaveBeenCalledTimes(2));
 expect(s.deps.createPix.mock.calls[0][0].idempotencyKey).toBe(s.deps.createPix.mock.calls[1][0].idempotencyKey);
 finish();await Promise.all([first,retry]);
 expect((await runPrepaidCheckout(input,s.deps)).paymentId).toBe("p");expect(s.deps.createPix).toHaveBeenCalledTimes(2);
 });
 it("wrong provider amount remains uncertain without completion",async()=>{
 const s=scenario();s.deps.createPix.mockResolvedValue({...s.resource,transaction_amount:1});
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toThrow();expect(s.a.state).toBe("submitted");
 });
 it("rejected Pix is reconciled officially before completion, without granting through creation",async()=>{
 const s=scenario();s.deps.createPix.mockResolvedValue({...s.resource,status:"rejected",point_of_interaction:{transaction_data:{ticket_url:null}}} as any);
 s.deps.syncPayment.mockResolvedValue("rejected");
 await runPrepaidCheckout(input,s.deps);expect(s.deps.syncPayment).toHaveBeenCalledOnce();expect(s.a.state).toBe("ready");
 await runPrepaidCheckout(input,s.deps);expect(s.deps.createPix).toHaveBeenCalledOnce();expect(s.deps.syncPayment).toHaveBeenCalledOnce();
 });
 it("card preference lost response recovers original preference with frozen price",async()=>{
 const s=scenario();const card={id:"pref",external_reference:"payment:p:subscription:s",items:[{quantity:1,unit_price:67.83,currency_id:"BRL"}],init_point:"https://www.mercadopago.com.br/checkout"};
 s.deps.createCard.mockImplementation(async()=>{s.setExternal(card);throw Error("timeout");});
 const cardInput={...input,paymentMethod:"card" as const};await expect(runPrepaidCheckout(cardInput,s.deps)).rejects.toThrow();
 expect((await runPrepaidCheckout(cardInput,s.deps)).amountCents).toBe(6783);expect(s.deps.createCard).toHaveBeenCalledOnce();
 });
});

it.each(["pix", "card"] as const)("validates first %s resource and logs no private provider messages", async method => {
 const s=scenario();const log=vi.spyOn(console,"warn").mockImplementation(()=>{});
 const create=method==="pix"?s.deps.createPix:s.deps.createCard;
 create.mockRejectedValue(new Error("private email token QR secret"));
 try {
  await expect(runPrepaidCheckout({...input,paymentMethod:method,correlationId:"safe-correlation"},s.deps)).rejects.toMatchObject({code:"SERVICE_UNAVAILABLE",cause:{message:"private email token QR secret"}});
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/private email|synthetic@example|QR secret/);
  expect(log).toHaveBeenCalledWith(expect.objectContaining({stage:"submit",correlation_id:"safe-correlation",duration_ms:expect.any(Number)}));
 } finally {log.mockRestore();}
});
it("creates a card preference once and rejects a mismatched first response",async()=>{
 const s=scenario();const card={id:"pref",external_reference:"payment:p:subscription:s",items:[{quantity:1,unit_price:67.83,currency_id:"BRL"}],init_point:"https://www.mercadopago.com.br/checkout"};
 s.deps.createCard.mockResolvedValue({...card,external_reference:"other"});
 await expect(runPrepaidCheckout({...input,paymentMethod:"card"},s.deps)).rejects.toMatchObject({cause:{category:"reference_mismatch"}});
 s.setExternal(card);
 expect((await runPrepaidCheckout({...input,paymentMethod:"card"},s.deps)).paymentId).toBe("p");
 expect(s.deps.createCard).toHaveBeenCalledOnce();
});
it.each(["external_reference","currency_id","transaction_amount"])("rejects recovered Pix with wrong %s",async field=>{
 const s=scenario();s.a.state="submitted";s.setExternal({...s.resource,[field]:field==="transaction_amount"?1:"wrong"});
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toThrow();
 expect(s.deps.rpc.mock.calls.some(([name])=>name==="complete_prepaid_submission")).toBe(false);
 expect(s.deps.createPix).not.toHaveBeenCalled();
});
it("does not authorize submission from a malformed claim response",async()=>{
 const s=scenario();const original=s.deps.rpc.getMockImplementation()!;
 s.deps.rpc.mockImplementation(async(name,args)=>name==="claim_prepaid_submission"?{}:original(name,args));
 await expect(runPrepaidCheckout(input,s.deps)).rejects.toMatchObject({cause:{category:"invalid_claim"}});
 expect(s.deps.createPix).not.toHaveBeenCalled();
});
it.each([undefined,"TEST"])("creates card with coupon %s and reuses ready result",async couponCode=>{
 const s=scenario();if(couponCode)(s.a.snapshot as any).affiliate={code:couponCode};
 const original=s.deps.rpc.getMockImplementation()!;
 s.deps.rpc.mockImplementation((name,args)=>original(name==="prepare_affiliate_prepaid_checkout"?"prepare_prepaid_checkout":name,args));
 s.deps.createCard.mockResolvedValue({id:"pref",external_reference:"payment:p:subscription:s",items:[{quantity:1,unit_price:67.83,currency_id:"BRL"}],init_point:"https://www.mercadopago.com.br/checkout"});
 const call={...input,paymentMethod:"card" as const,couponCode};
 expect((await runPrepaidCheckout(call,s.deps)).amountCents).toBe(6783);
 await runPrepaidCheckout(call,s.deps);expect(s.deps.createCard).toHaveBeenCalledOnce();
});
