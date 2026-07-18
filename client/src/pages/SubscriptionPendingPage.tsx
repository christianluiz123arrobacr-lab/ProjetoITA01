import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  HelpCircle,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getBillingCapabilities, getMyLatestSubscriptionRequest, refreshMyPaymentStatus } from "@/services/billing.service";

const MANUAL_PIX = {
  key: "66997227099",
  displayKey: "(66) 99722-7099",
  whatsapp: "5566997227099",
  receiver: "Rumo ao ITA",
};

type LatestSubscription = {
  subscription_id: string;
  status: string;
  gateway: string | null;
  payment_url: string | null;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_due_date: string | null;
  created_at: string | null;
  plan_id: string;
  plan_slug: string;
  plan_name: string;
  plan_description: string | null;
  plan_price_cents: number;
};

function formatDate(date?: string | null) {
  if (!date) return "Sem data";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sem data";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(cents?: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cents || 0) / 100);
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "manual_review":
      return "Aguardando confirmação";
    case "active":
    case "trialing":
      return "Assinatura ativa";
    case "expired":
      return "Assinatura vencida";
    case "overdue":
      return "Pagamento em atraso";
    case "canceled":
      return "Assinatura cancelada";
    case "failed":
      return "Pagamento não confirmado";
    default:
      return "Sem assinatura ativa";
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "manual_review":
      return "border-amber-300/30 bg-amber-300/10 text-amber-100";
    case "active":
    case "trialing":
      return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
    case "expired":
    case "overdue":
      return "border-orange-300/30 bg-orange-300/10 text-orange-100";
    case "canceled":
    case "failed":
      return "border-red-300/30 bg-red-300/10 text-red-100";
    default:
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  }
}

function shouldShowPix(subscription?: LatestSubscription | null) {
  if (!subscription) return false;

  return ["manual_review", "pending", "expired", "overdue", "canceled", "failed"].includes(
    subscription.status
  );
}

export default function SubscriptionPendingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [subscription, setSubscription] = useState<LatestSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [manualPixEnabled, setManualPixEnabled] = useState(false);
  const [latestPayment, setLatestPayment] = useState<any | null>(null);

  const whatsappUrl = useMemo(() => {
    const planName = subscription?.plan_name || "plano da plataforma";
    const price = subscription?.plan_price_cents
      ? formatMoney(subscription.plan_price_cents)
      : "valor do plano";
    const message = `Olá! Fiz ou vou fazer o pagamento da assinatura ${planName} (${price}) da plataforma Rumo ao ITA. Segue meu comprovante.`;

    return `https://wa.me/${MANUAL_PIX.whatsapp}?text=${encodeURIComponent(message)}`;
  }, [subscription]);

  useEffect(() => {
    if (!subscription || ["active", "expired", "failed", "refunded", "canceled"].includes(subscription.status)) return;
    const timer = window.setInterval(() => {
      loadLatestSubscription(true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [subscription?.subscription_id, subscription?.status]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  async function handleCopyPix() {
    try {
      await navigator.clipboard.writeText(MANUAL_PIX.key);
      setCopyMessage("Chave Pix copiada.");
    } catch (error) {
      console.error("Erro ao copiar Pix:", error);
      setCopyMessage("Não foi possível copiar a chave Pix.");
    }
  }

  async function loadLatestSubscription(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingSubscription(true);
      }

      setErrorMessage("");
      setCopyMessage("");

      const [data, capabilities, refreshed] = await Promise.all([
        getMyLatestSubscriptionRequest(),
        getBillingCapabilities(),
        refreshMyPaymentStatus().catch(() => null),
      ]);
      setManualPixEnabled(Boolean(capabilities.manualPixFallbackEnabled));
      const payments = Array.isArray(refreshed?.payments) ? refreshed.payments : [];
      setLatestPayment(payments[0] ?? null);

      if (!data) {
        setSubscription(null);
        return;
      }

      setSubscription({
        subscription_id: data.subscription_id,
        status: data.status,
        gateway: data.gateway,
        payment_url: data.payment_url,
        started_at: data.started_at,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        next_due_date: data.next_due_date,
        created_at: data.created_at,
        plan_id: data.plan_id || "",
        plan_slug: data.plan_slug || "",
        plan_name: data.plan_name || "Plano da plataforma",
        plan_description: data.plan_description || null,
        plan_price_cents: Number(data.plan_price_cents || 0),
      });
    } catch (error) {
      console.error("Erro inesperado ao carregar assinatura:", error);
      setErrorMessage("Ocorreu um erro inesperado ao carregar sua assinatura.");
    } finally {
      setLoadingSubscription(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLatestSubscription();
  }, []);

  const statusLabel = getStatusLabel(subscription?.status);
  const showPix = shouldShowPix(subscription);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${getStatusClass(subscription?.status)}`}>
              <Clock className="h-4 w-4" />
              {statusLabel}
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Sua conta está criada. Agora falta liberar o acesso.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              O acesso aos conteúdos pagos é liberado somente depois da confirmação do pagamento. Pagamentos Mercado Pago são confirmados automaticamente pelo webhook; comprovante por WhatsApp aparece apenas no Pix manual emergencial.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Conta criada</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Seu cadastro já está vinculado ao seu e-mail de login.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Pagamento</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Para Mercado Pago, conclua o checkout e use “Atualizar status”; para Pix manual, siga as instruções exibidas abaixo.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Liberação</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Após confirmação, o acesso é ativado no seu usuário.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/planos">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                  Ver planos
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>

              <button
                type="button"
                onClick={() => loadLatestSubscription(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Atualizar status
              </button>

              {!authLoading && isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-6 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              )}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-white/10">
              <LockKeyhole className="h-7 w-7 text-cyan-200" />
            </div>

            <h2 className="text-2xl font-black">Status da sua assinatura</h2>

            {loadingSubscription ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
                Carregando assinatura...
              </div>
            ) : null}

            {!loadingSubscription && errorMessage ? (
              <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">
                {errorMessage}
              </div>
            ) : null}

            {!loadingSubscription && !subscription ? (
              <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="font-black text-cyan-100">Nenhum plano solicitado ainda</p>
                <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                  Escolha um plano na página de planos para iniciar a solicitação de acesso.
                </p>
              </div>
            ) : null}

            {!loadingSubscription && subscription ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Plano</p>
                  <p className="mt-1 text-xl font-black text-white">{subscription.plan_name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatMoney(subscription.plan_price_cents)} • {getStatusLabel(subscription.status)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Solicitado em</p>
                    <p className="mt-1 font-black text-white">{formatDate(subscription.created_at)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Vencimento</p>
                    <p className="mt-1 font-black text-white">{formatDate(subscription.current_period_end)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {manualPixEnabled && showPix ? (
              <div className="mt-6 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-black text-cyan-100">Pix manual emergencial</p>
                    <p className="text-xs text-cyan-50/70">Use somente quando o fallback manual estiver habilitado.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Chave Pix</p>
                  <p className="mt-1 break-all text-xl font-black text-white">{MANUAL_PIX.displayKey}</p>
                  <p className="mt-1 text-sm text-slate-400">Recebedor: {MANUAL_PIX.receiver}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Pix
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar comprovante
                  </a>
                </div>

                {copyMessage ? (
                  <p className="mt-3 text-sm font-semibold text-cyan-100">{copyMessage}</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
                <div>
                  <p className="font-black text-amber-100">Já pagou?</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50/80">
                    {manualPixEnabled && showPix
                      ? "Se você usou o Pix manual emergencial, envie o comprovante pelo WhatsApp. Se pagou pelo Mercado Pago, aguarde a confirmação automática e clique em Atualizar status."
                      : "Se o pagamento foi feito pelo Mercado Pago, a confirmação é automática. Use Atualizar status; não envie comprovante manual para Pix automático."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Plataforma beta
              </div>

              <h2 className="text-2xl font-black text-white">
                O acesso fica bloqueado até a assinatura ser ativada.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Assim que a assinatura for aprovada, a plataforma libera automaticamente o acesso às áreas pagas da conta.
              </p>
            </div>

            <Link href="/planos">
              <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
                Escolher ou trocar plano
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
