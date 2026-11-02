import { TRPCError } from "@trpc/server";
import { centsToMercadoPagoAmount, mercadoPagoAmountToCents } from "./billingStatusMapper.js";
import { MercadoPagoHttpError, PrepaidResourceError } from "./mercadoPagoClient.js";

export type PrepaidInput = { userId:string; userEmail:string|null; planSlug:string; durationMonths:1|2|3|6|12; paymentMethod:"pix"|"card"; attemptKey:string; couponCode?:string; correlationId?:string };
type Dependencies = {
  rpc: (name:string,args:Record<string,unknown>) => Promise<any>;
  recover: (method:"card"|"pix",reference:string) => Promise<any>;
  createPix: (input:any) => Promise<any>;
  createCard: (input:any) => Promise<any>;
  syncPayment: (resource:any) => Promise<string>;
  notificationUrl:string; backUrl:string;
  affiliateCheckoutEnabled?:boolean;
};

export async function runPrepaidCheckout(input:PrepaidInput, deps:Dependencies) {
  let stage = "prepare";
  const started = Date.now();
  const check = (ok: boolean, category: string) => { if (!ok) throw new PrepaidResourceError(category, stage); };
  try {
  // Preparation recovers an existing attempt before revalidating mutable offers.
  // New attempts are checked by SQL too, including eligibility and plan capacity.
  const email = input.userEmail;
  const a = await deps.rpc(input.couponCode?"prepare_affiliate_prepaid_checkout":"prepare_prepaid_checkout",{p_user:input.userId,p_key:input.attemptKey,p_slug:input.planSlug,p_months:input.durationMonths,p_method:input.paymentMethod,p_email:email,...(input.couponCode?{p_coupon:input.couponCode,p_backend_enabled:deps.affiliateCheckoutEnabled===true}:{})});
  check(!!a?.id && !!a.payment_id && !!a.snapshot, "invalid_attempt");
  if(a.snapshot.affiliate?.code!==input.couponCode)throw new TRPCError({code:"CONFLICT",message:"O cupom difere da compra anterior. Recupere a tentativa existente."});
  if (a.state === "ready") return {...a.result,paymentStatus:a.payment_status??"pending"};
  const s=a.snapshot;
  const reference=`payment:${a.payment_id}:subscription:${s.subscription_id}`;
  // Only the CAS winner may submit the first POST. Recoveries search first;
  // if a Pix is not visible yet, the same frozen request can be replayed with
  // the same Mercado Pago idempotency key to recover/create one resource.
  stage = "claim";
  const claimed = await deps.rpc("claim_prepaid_submission",{p_user:input.userId,p_attempt:a.id});
  check(typeof claimed === "boolean", "invalid_claim");
  stage = claimed ? "submit" : "recover";
    let resource:any;
    const idempotencyKey=`mp-prepaid-${a.payment_id}`;
    const common={externalReference:reference,payerEmail:s.payer_email,amount:centsToMercadoPagoAmount(s.total_cents),
      notificationUrl:deps.notificationUrl,idempotencyKey};
    if (claimed) {
      resource=input.paymentMethod==="card"
        ? await deps.createCard({...common,title:`${s.title} — pacote de ${a.months} meses`,backUrl:deps.backUrl})
        : await deps.createPix({...common,description:`${s.title} — pacote de ${a.months} meses`,expiresAt:s.expires_at});
    } else {
      resource=await deps.recover(input.paymentMethod,reference);
      // Payments API explicitly supports safe retries with the same
      // X-Idempotency-Key. Keep all values frozen to this attempt; never mint a
      // new key here. A lookup error still fails closed and does not POST.
      if (!resource && input.paymentMethod==="pix") {
        const expiresAt=Date.parse(s.expires_at);
        check(Number.isFinite(expiresAt) && expiresAt>Date.now(), "expired_unconfirmed_attempt");
        stage="retry_same_idempotency_key";
        resource=await deps.createPix({...common,description:`${s.title} — pacote de ${a.months} meses`,expiresAt:s.expires_at});
      }
    }
    check(!!resource, "search_empty");
    stage = "validate_resource";
    check(!!resource?.id, "missing_id");
    check(resource.external_reference === reference, "reference_mismatch");
    if (input.paymentMethod === "pix") {
      check(resource.currency_id === "BRL", "currency_mismatch");
      check(mercadoPagoAmountToCents(resource.transaction_amount) === s.total_cents, "amount_mismatch");
    } else {
      check(Array.isArray(resource.items) && resource.items.length === 1, "invalid_items");
      check(resource.items[0].currency_id === "BRL", "currency_mismatch");
      check(resource.items[0].quantity === 1 && mercadoPagoAmountToCents(resource.items[0].unit_price) === s.total_cents, "amount_mismatch");
    }
    const url=input.paymentMethod==="card" ? resource.init_point??resource.sandbox_init_point : resource.point_of_interaction?.transaction_data?.ticket_url;
    let paymentStatus="pending";
    stage = "sync_status";
    if(input.paymentMethod==="pix" && ["approved","rejected","cancelled","refunded","charged_back"].includes(resource.status)) paymentStatus=await deps.syncPayment(resource);
    check(!!url || paymentStatus !== "pending", "missing_checkout_url");
    const result={subscriptionId:s.subscription_id,paymentId:a.payment_id,checkoutUrl:url,amountCents:s.total_cents,currency:"BRL",expiresAt:s.expires_at,externalReference:reference,providerResourceId:String(resource.id)};
    stage = "persist";
    const completed = await deps.rpc("complete_prepaid_submission",{p_user:input.userId,p_attempt:a.id,p_result:result,p_gateway_id:input.paymentMethod==="pix"?String(resource.id):null});
    check(completed?.paymentId === a.payment_id, "invalid_completion");
    return completed;
  } catch (cause) {
    // Neither release nor mark failed: request may have succeeded externally.
    const root = cause instanceof PrepaidResourceError ? cause.cause ?? cause : cause;
    const http = root instanceof MercadoPagoHttpError ? root : undefined;
    const category = cause instanceof PrepaidResourceError && cause.category !== "provider_lookup_failed" ? cause.category : http ? (http.status === 401 || http.status === 403 ? "provider_configuration" : http.status >= 500 || http.status === 429 ? "provider_unavailable" : "provider_rejected") : root instanceof Error && root.name === "AbortError" ? "timeout" : root instanceof SyntaxError || root instanceof Error && root.name === "ZodError" ? "invalid_response" : root instanceof TypeError ? "network_error" : "operation_failed";
    const databaseCode = cause instanceof TRPCError ? (cause.cause as {code?:string})?.code : undefined;
    console.warn({event:"prepaid_checkout_recovery_required",stage, operation:cause instanceof PrepaidResourceError ? cause.operation : stage, category, http_status:http?.status,
      provider_request_id: http?.requestId && /^[A-Za-z0-9_-]{1,100}$/.test(http.requestId) ? http.requestId : undefined,
      provider_error_codes:http?.diagnostics?.codes, provider_error_fields:http?.diagnostics?.fields,
      provider_reason:http?.diagnostics?.reason,
      database_code:databaseCode && /^[A-Z0-9]{5}$/.test(databaseCode) ? databaseCode : undefined,
      correlation_id:input.correlationId, duration_ms:Date.now()-started});
    if (cause instanceof TRPCError && ["CONFLICT", "BAD_REQUEST", "FORBIDDEN"].includes(cause.code) && stage === "prepare") throw cause;
    const review = ["multiple_results","reference_mismatch","currency_mismatch","amount_mismatch","invalid_items","invalid_response","missing_id","invalid_claim","invalid_completion","expired_unconfirmed_attempt"].includes(category);
    const message = review || category === "provider_rejected" || category === "provider_configuration"
      ? "Esta tentativa precisa de revisão pelo suporte. Preserve a compra anterior e não inicie outra."
      : category === "search_empty"
        ? "O provedor ainda não confirmou esta tentativa. Use Recuperar compra anterior mais tarde; se persistir, contate o suporte. Não inicie outra compra."
        : "Não foi possível consultar ou confirmar esta tentativa agora. Use Recuperar compra anterior; se persistir, contate o suporte. Não inicie outra compra.";
    throw new TRPCError({code:"SERVICE_UNAVAILABLE",message, cause});
  }
}
