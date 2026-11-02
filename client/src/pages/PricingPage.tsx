import { showPlanForCheckout } from "@/lib/checkoutPresentation";
import PrepaidOptions from "@/components/billing/PrepaidOptions";
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";

import PublicHeader from "@/components/billing/CommerceHeader";
import {
  createCardSubscriptionCheckout,
  createPrepaidCheckout,
  createMercadoPagoPixPayment,
  formatPlanPrice,
  getBillingCapabilities,
  getReferralPricingPreview,
  loadPublicBillingPlans,
  PIX_PAYMENT_INFO,
  requestManualSubscription,
  type BillingCapabilities,
  type BillingPlan,
  type MercadoPagoPixResult,
  type ReferralPricingPreview,
} from "@/services/billing.service";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

function PixPaymentModal({
  plan,
  onClose,
  onGoPending,
}: {
  plan: BillingPlan;
  onClose: () => void;
  onGoPending: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const whatsappMessage = encodeURIComponent(
    `Olá! Fiz o Pix do plano ${plan.name} (${formatPlanPrice(plan.amountCents)}). Segue o comprovante.`
  );
  const whatsappUrl = `https://wa.me/${PIX_PAYMENT_INFO.whatsapp}?text=${whatsappMessage}`;

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(PIX_PAYMENT_INFO.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-cyan-950/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-cyan-100">
              Pix manual
            </div>
            <h2 className="text-2xl font-black text-white">
              Finalize o pagamento do plano
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Faça o Pix, envie o comprovante no WhatsApp e aguarde a liberação
              manual do acesso.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-sm text-slate-400">Plano escolhido</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xl font-black text-white">{plan.name}</p>
                <p className="text-sm leading-6 text-slate-400">
                  {plan.description}
                </p>
              </div>
              <p className="text-3xl font-black text-cyan-200">
                {formatPlanPrice(plan.amountCents)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-100">
              Chave Pix / WhatsApp
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-2xl border border-cyan-300/20 bg-slate-950/70 px-4 py-3">
                <p className="text-xs text-cyan-100/70">Número</p>
                <p className="mt-1 text-xl font-black text-white">
                  {PIX_PAYMENT_INFO.displayKey}
                </p>
              </div>

              <button
                type="button"
                onClick={copyPixKey}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copiado" : "Copiar Pix"}
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-cyan-50/85">
              Depois do pagamento, envie o comprovante para esse mesmo número. A
              liberação é feita manualmente durante esta fase beta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/25"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar comprovante
            </a>

            <button
              type="button"
              onClick={onGoPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Acompanhar assinatura
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MercadoPagoPixModal({
  payment,
  onClose,
  onGoPending,
}: {
  payment: MercadoPagoPixResult;
  onClose: () => void;
  onGoPending: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(payment.qrCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-cyan-950/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-cyan-100">
              Pix Mercado Pago
            </div>
            <h2 className="text-2xl font-black text-white">Finalize seu Pix</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A liberação é automática após confirmação segura do webhook do
              Mercado Pago.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.1] hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-sm text-slate-400">Valor</p>
            <p className="mt-1 text-3xl font-black text-cyan-200">
              {formatPlanPrice(payment.amountCents)}
            </p>
            {payment.expiresAt && (
              <p className="mt-2 text-sm text-slate-400">
                Expira em {new Date(payment.expiresAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>
          {payment.qrCodeBase64 && (
            <div className="flex justify-center rounded-3xl border border-white/10 bg-white p-5">
              <img
                src={`data:image/png;base64,${payment.qrCodeBase64}`}
                alt="QR Code Pix Mercado Pago"
                className="h-56 w-56"
              />
            </div>
          )}
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-100">
              Pix copia e cola
            </p>
            <p className="mt-3 max-h-28 overflow-auto break-all rounded-2xl border border-cyan-300/20 bg-slate-950/70 px-4 py-3 text-sm text-white">
              {payment.qrCode || "Aguardando código Pix."}
            </p>
            <button
              type="button"
              onClick={copyPix}
              disabled={!payment.qrCode}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copiado" : "Copiar Pix"}
            </button>
          </div>
          <button
            type="button"
            onClick={onGoPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
          >
            Já paguei, verificar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const {
    isAuthenticated,
    loading: authLoading,
    error: authError,
    recovering,
    user,
  } = useSupabaseAuth();

  const authIdentity = useRef(user?.id);
  authIdentity.current = user?.id;
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [catalogOwner, setCatalogOwner] = useState<string | undefined | null>(
    null
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    "card" | "pix" | "manual" | null
  >(null);
  const [capabilities, setCapabilities] = useState<BillingCapabilities | null>(
    null
  );
  const [referralPreview, setReferralPreview] =
    useState<ReferralPricingPreview | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<BillingPlan | null>(null);
  const [pixPayment, setPixPayment] = useState<MercadoPagoPixResult | null>(
    null
  );
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");

  const isLoading = useMemo(
    () => authLoading || selectedPlan !== null || catalogOwner !== user?.id,
    [authLoading, selectedPlan, catalogOwner, user?.id]
  );

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        setPlansLoading(true);
        setPlans([]);
        setChosen(null);
        setCapabilities(null);
        setReferralPreview(null);
        const [loadedPlans, loadedCapabilities, loadedReferralPreview] =
          await Promise.all([
            loadPublicBillingPlans(),
            getBillingCapabilities(),
            isAuthenticated
              ? getReferralPricingPreview().catch(() => null)
              : Promise.resolve(null),
          ]);

        if (mounted) {
          setCatalogOwner(user?.id);
          setPlans(loadedPlans);
          setCapabilities(loadedCapabilities);
          setReferralPreview(loadedReferralPreview);
        }
      } catch (error) {
        if (mounted)
          setErro(
            "Não foi possível consultar os planos agora. Atualize a página para tentar novamente."
          );
      } finally {
        if (mounted) setPlansLoading(false);
      }
    }

    loadPlans();

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated, user?.id]);

  async function handleSubscribe(
    plan: BillingPlan,
    method: "card" | "pix" | "manual",
    prepaid = false,
    months: 1 | 2 | 3 | 6 | 12 = 1,
    fresh = false,
    couponCode?: string
  ) {
    const buyer = user?.id;
    setErro("");
    setSuccess("");
    if (authLoading || authError || recovering) return;
    if (!isAuthenticated) {
      navigate(
        "/login?returnTo=" +
          encodeURIComponent("/planos" + window.location.search)
      );
      return;
    }
    if (
      plan.checkoutBlockReason === "legacy_founder_required" ||
      plan.hasAvailableSlots === false
    ) {
      setErro("Plano indisponível para esta conta.");
      return;
    }
    if (!prepaid && !plan.canCheckout) {
      setErro("Gerencie sua assinatura atual antes de iniciar outra cobrança.");
      return;
    }
    try {
      setSelectedPlan(plan.slug);
      setSelectedMethod(method);
      if (prepaid && method !== "manual") {
        const checkout = await createPrepaidCheckout(
          plan.slug,
          months,
          method,
          fresh,
          couponCode
        );
        if (authIdentity.current !== buyer) return;
        if (!checkout.checkoutUrl) {
          setSuccess(
            "Consulte o resultado da compra em Minha assinatura ou recupere a compra anterior."
          );
          return;
        }
        window.location.assign(checkout.checkoutUrl);
        return;
      }
      if (method === "card") {
        const checkout = await createCardSubscriptionCheckout(plan.slug);
        if (authIdentity.current !== buyer) return;
        if (!checkout.checkoutUrl)
          throw new Error("Checkout indisponível. Tente novamente.");
        window.location.assign(checkout.checkoutUrl);
        return;
      }
      if (method === "pix") {
        const pix = await createMercadoPagoPixPayment(plan.slug);
        if (authIdentity.current !== buyer) return;
        setPixPayment(pix);
        return;
      }
      await requestManualSubscription(plan.slug);
      setPaymentPlan(plan);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento. Recupere a compra anterior antes de tentar outra."
      );
    } finally {
      setSelectedPlan(null);
      setSelectedMethod(null);
    }
  }

  return (
    <main className="commerce-surface min-h-screen bg-background text-foreground">
      <PublicHeader />
      {pixPayment && (
        <MercadoPagoPixModal
          payment={pixPayment}
          onClose={() => setPixPayment(null)}
          onGoPending={() => navigate("/assinatura-pendente")}
        />
      )}
      {paymentPlan && (
        <PixPaymentModal
          plan={paymentPlan}
          onClose={() => setPaymentPlan(null)}
          onGoPending={() => navigate("/assinatura-pendente")}
        />
      )}
      <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <header className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
            Projeto Vetor
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Seu próximo passo começa aqui
          </h1>
          <p className="mt-4 text-muted-foreground">
            Escolha seu plano e o tempo de acesso. Confira as condições antes de
            seguir para o Mercado Pago.
          </p>
        </header>
        <ol
          aria-label="Etapas da contratação"
          className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {["Conta", "Plano e prazo", "Pagamento", "Confirmação"].map(
            (step, index) => (
              <li
                key={step}
                className="rounded-xl border border-border p-3 text-sm"
              >
                <span className="mr-2 font-bold text-cyan-700 dark:text-cyan-300">
                  {index + 1}.
                </span>
                {step}
                {index === 0 && isAuthenticated && (
                  <Check
                    className="ml-2 inline h-4 w-4"
                    aria-label="Conta conectada"
                  />
                )}
              </li>
            )
          )}
        </ol>
        <div className="mb-5 rounded-2xl border border-border bg-muted/40 p-5">
          {authLoading ? (
            <p role="status">Verificando sua conta…</p>
          ) : authError || recovering ? (
            <p role="alert">
              Não foi possível confirmar sua sessão. Aguarde a recuperação antes
              de pagar.
            </p>
          ) : isAuthenticated ? (
            <p>
              Conta conectada. Você pode escolher seu plano sem preencher o
              cadastro novamente.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <p>Comece pela sua conta:</p>
              <a
                className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white"
                href={
                  "/cadastro?returnTo=" +
                  encodeURIComponent("/planos" + window.location.search)
                }
              >
                Criar conta
              </a>
              <a
                className="underline"
                href={
                  "/login?returnTo=" +
                  encodeURIComponent("/planos" + window.location.search)
                }
              >
                Já tenho conta
              </a>
            </div>
          )}
        </div>
        {erro && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
          >
            {erro}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
          >
            {success}
          </p>
        )}
        {plansLoading ? (
          <p role="status" className="py-12 text-center">
            Carregando planos…
          </p>
        ) : plans.length === 0 ? (
          <p role="status">
            Nenhum plano disponível no momento. Atualize a página para consultar
            novamente.
          </p>
        ) : (
          <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans
              .filter(plan =>
                showPlanForCheckout(
                  plan,
                  isAuthenticated,
                  authLoading ||
                    !!authError ||
                    recovering ||
                    catalogOwner !== user?.id
                )
              )
              .map(plan => {
                const locked =
                  plan.checkoutBlockReason === "legacy_founder_required";
                const unavailable = locked || plan.hasAvailableSlots === false;
                return (
                  <article
                    key={plan.slug + ":" + (user?.id ?? "anonymous")}
                    className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
                  >
                    <div className="min-h-24">
                      <h2 className="text-2xl font-bold">{plan.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    <p className="mb-5 text-sm text-muted-foreground">
                      Referência de preço mensal:{" "}
                      <strong className="text-foreground">
                        {formatPlanPrice(plan.amountCents)}
                      </strong>
                      . O total do pacote aparece abaixo.
                    </p>
                    {locked && (
                      <p className="mb-4 text-sm" role="status">
                        Exclusivo para fundadores elegíveis ou convidados. A
                        elegibilidade é verificada pelo servidor.
                      </p>
                    )}
                    {plan.hasAvailableSlots === false && (
                      <p className="mb-4 text-sm">
                        Sem vagas disponíveis para nova compra.
                      </p>
                    )}
                    {referralPreview?.eligible && (
                      <p className="mb-4 text-sm text-muted-foreground">
                        Sua indicação pode oferecer desconto no primeiro
                        pagamento via Pix ou pacote pré-pago, conforme a prévia
                        do servidor. O benefício não se aplica à assinatura
                        mensal recorrente no cartão.
                      </p>
                    )}
                    <div className="mt-auto">
                      <button
                        type="button"
                        disabled={isLoading || !!authError || recovering}
                        aria-pressed={chosen === plan.slug}
                        className="mb-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
                        onClick={() => setChosen(plan.slug)}
                      >
                        {" "}
                        {chosen === plan.slug
                          ? "Plano selecionado"
                          : "Escolher plano"}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
        {plans
          .filter(
            plan =>
              plan.slug === chosen &&
              showPlanForCheckout(
                plan,
                isAuthenticated,
                authLoading ||
                  !!authError ||
                  recovering ||
                  catalogOwner !== user?.id
              )
          )
          .map(plan => {
            const unavailable =
              plan.checkoutBlockReason === "legacy_founder_required" ||
              plan.hasAvailableSlots === false;
            return (
              <section
                key={plan.slug + ":" + (user?.id ?? "anonymous")}
                className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6"
                aria-label="Configurar contratação"
              >
                <h2 className="mb-4 text-xl font-bold">
                  {plan.name} · escolha seu prazo
                </h2>
                <PrepaidOptions
                  key={plan.slug + ":" + (user?.id ?? "anonymous")}
                  planSlug={plan.slug}
                  disabled={
                    isLoading ||
                    !!authError ||
                    recovering ||
                    unavailable ||
                    capabilities?.mercadoPagoEnabled !== true
                  }
                  onBuy={(method, months, fresh, code) =>
                    handleSubscribe(plan, method, true, months, fresh, code)
                  }
                />{" "}
                <details className="mt-5 rounded-xl border border-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Outras formas de contratação
                  </summary>
                  <p className="my-3 text-xs text-muted-foreground">
                    Assinatura mensal recorrente no cartão:{" "}
                    {formatPlanPrice(plan.amountCents)} por mês, com cobranças
                    recorrentes conforme o contrato. Não utiliza o cupom do
                    pacote.
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border p-3 text-sm disabled:opacity-50"
                    disabled={
                      isLoading ||
                      !plan.canCheckout ||
                      unavailable ||
                      capabilities?.mercadoPagoEnabled !== true
                    }
                    onClick={() => handleSubscribe(plan, "card")}
                  >
                    Contratar assinatura recorrente
                  </button>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-xl border border-border p-3 text-sm disabled:opacity-50"
                    disabled={
                      isLoading ||
                      !plan.canCheckout ||
                      unavailable ||
                      capabilities?.mercadoPagoEnabled !== true
                    }
                    onClick={() => handleSubscribe(plan, "pix")}
                  >
                    Pix mensal avulso
                  </button>
                  {capabilities?.manualPixFallbackEnabled && (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-xl border border-border p-3 text-sm"
                      disabled={isLoading || !plan.canCheckout || unavailable}
                      onClick={() => handleSubscribe(plan, "manual")}
                    >
                      Solicitar Pix manual emergencial
                    </button>
                  )}
                </details>
              </section>
            );
          })}
        <footer className="mt-8 rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
          <h2 className="font-bold text-foreground">Depois do pagamento</h2>
          <p>
            A confirmação é feita pelas consultas oficiais do Mercado Pago. Uma
            tentativa sem resposta não significa pagamento recusado. Recupere a
            compra anterior e acompanhe seu status em{" "}
            <a className="underline" href="/minha-assinatura">
              Minha assinatura
            </a>
            .
          </p>
        </footer>
      </section>
    </main>
  );
}
