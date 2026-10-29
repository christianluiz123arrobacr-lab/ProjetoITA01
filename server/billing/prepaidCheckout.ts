import { TRPCError } from "@trpc/server";
import { centsToMercadoPagoAmount, mercadoPagoAmountToCents } from "./billingStatusMapper.js";

export type PrepaidInput = { userId:string; userEmail:string|null; planSlug:string; durationMonths:1|2|3|6|12; paymentMethod:"pix"|"card"; attemptKey:string; couponCode?:string };
type Dependencies = {
  rpc: (name:string,args:Record<string,unknown>) => Promise<any>;
  recover: (method:"card"|"pix",reference:string) => Promise<any>;
  createPix: (input:any) => Promise<any>;
  createCard: (input:any) => Promise<any>;
  syncPayment: (resource:any) => Promise<string>;
  notificationUrl:string; backUrl:string;
  affiliateCheckoutEnabled?:boolean;
};
const uncertain = () => new TRPCError({code:"SERVICE_UNAVAILABLE",message:"Sua tentativa está sendo recuperada. Tente consultar novamente; não inicie outra compra. Se persistir, contate o suporte."});

export async function runPrepaidCheckout(input:PrepaidInput, deps:Dependencies) {
  // Preparation recovers an existing attempt before revalidating mutable offers.
  // New attempts are checked by SQL too, including eligibility and plan capacity.
  const email = input.userEmail;
  const a = await deps.rpc(input.couponCode?"prepare_affiliate_prepaid_checkout":"prepare_prepaid_checkout",{p_user:input.userId,p_key:input.attemptKey,p_slug:input.planSlug,p_months:input.durationMonths,p_method:input.paymentMethod,p_email:email,...(input.couponCode?{p_coupon:input.couponCode,p_backend_enabled:deps.affiliateCheckoutEnabled===true}:{})});
  if (!a?.id || !a.payment_id || !a.snapshot) throw uncertain();
  if(a.snapshot.affiliate?.code!==input.couponCode)throw new TRPCError({code:"CONFLICT",message:"O cupom difere da compra anterior. Recupere a tentativa existente."});
  if (a.state === "ready") return {...a.result,paymentStatus:a.payment_status??"pending"};
  const s=a.snapshot;
  const reference=`payment:${a.payment_id}:subscription:${s.subscription_id}`;
  // Only the CAS winner may POST. Every other caller performs official GETs.
  const claimed = await deps.rpc("claim_prepaid_submission",{p_user:input.userId,p_attempt:a.id});
  try {
    let resource:any;
    if (claimed) {
      const common={externalReference:reference,payerEmail:s.payer_email,amount:centsToMercadoPagoAmount(s.total_cents),
        notificationUrl:deps.notificationUrl,idempotencyKey:`mp-prepaid-${a.payment_id}`};
      resource=input.paymentMethod==="card"
        ? await deps.createCard({...common,title:`${s.title} — pacote de ${a.months} meses`,backUrl:deps.backUrl})
        : await deps.createPix({...common,description:`${s.title} — pacote de ${a.months} meses`,expiresAt:s.expires_at});
    } else resource=await deps.recover(input.paymentMethod,reference);
    if (!resource?.id) throw uncertain();
    if (input.paymentMethod === "pix" && (resource.external_reference!==reference || resource.currency_id!=="BRL" || mercadoPagoAmountToCents(resource.transaction_amount)!==s.total_cents)) throw uncertain();
    if (input.paymentMethod === "card" && !claimed && (!Array.isArray(resource.items) || resource.items.length!==1 || resource.items[0].currency_id!=="BRL" || resource.items[0].quantity!==1 || mercadoPagoAmountToCents(resource.items[0].unit_price)!==s.total_cents)) throw uncertain();
    const url=input.paymentMethod==="card" ? resource.init_point??resource.sandbox_init_point : resource.point_of_interaction?.transaction_data?.ticket_url;
    let paymentStatus="pending";
    if(input.paymentMethod==="pix" && ["approved","rejected","cancelled","refunded","charged_back"].includes(resource.status)) paymentStatus=await deps.syncPayment(resource);
    if (!url && paymentStatus==="pending") throw uncertain();
    const result={subscriptionId:s.subscription_id,paymentId:a.payment_id,checkoutUrl:url,amountCents:s.total_cents,currency:"BRL",expiresAt:s.expires_at,externalReference:reference,providerResourceId:String(resource.id)};
    return await deps.rpc("complete_prepaid_submission",{p_user:input.userId,p_attempt:a.id,p_result:result,p_gateway_id:input.paymentMethod==="pix"?String(resource.id):null});
  } catch {
    // Neither release nor mark failed: request may have succeeded externally.
    console.warn({event:"prepaid_checkout_recovery_required",stage:claimed?"submit_or_persist":"recover"});
    throw uncertain();
  }
}
