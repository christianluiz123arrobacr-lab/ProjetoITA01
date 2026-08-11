import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cancelMySubscription, getBillingCapabilities, getMyLatestSubscriptionRequest, getMyPayments, syncMyMercadoPagoPaymentStatus } from "@/services/billing.service";
import { manualPaymentConfig } from "@/config/payment";
import {
  formatPriceFromCents,
  formatSubscriptionStatus,
  type BillingSubscriptionStatus,
} from "@/types/billing";

type MySubscriptionRow = {
  subscription_id: string;
  status: string;
  gateway: string;
  payment_url: string | null;

  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_due_date: string | null;

  plan_id: string;
  plan_slug: string;
  plan_name: string;
  plan_description: string | null;
  plan_price_cents: number;
};

function formatDate(date?: string | null) {
  if (!date) return "Sem data";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Sem data";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusInfo(status: string) {
  switch (status) {
    case "active":
      return {
        icon: CheckCircle2,
        title: "Assinatura ativa",
        description: "Seu acesso está liberado.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      };

    case "manual_review":
      return {
        icon: Clock3,
        title: "Aguardando confirmação",
        description:
          "Sua solicitação foi registrada. Faça o Pix e envie o comprovante para liberar o acesso.",
        className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      };

    case "pending":
      return {
        icon: Clock3,
        title: "Pagamento pendente",
        description: "Finalize o pagamento para liberar o acesso.",
        className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      };

    case "overdue":
      return {
        icon: AlertTriangle,
        title: "Pagamento em atraso",
        description: "Regularize sua assinatura para manter o acesso.",
        className: "border-orange-200 bg-orange-50 text-orange-800",
      };

    case "canceled":
      return {
        icon: XCircle,
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada.",
        className: "border-slate-200 bg-slate-50 text-slate-700",
      };

    default:
      return {
        icon: CreditCard,
        title: "Status da assinatura",
        description: "Veja os detalhes do seu plano.",
        className: "border-blue-200 bg-blue-50 text-blue-800",
      };
  }
}

function formatGatewayLabel(gateway?: string | null) {
  if (gateway === "mercadopago") return "Mercado Pago";
  if (gateway === "manual") return "Manual";
  return gateway || "Sem gateway";
}

export default function MinhaAssinaturaPage() {
  const [subscription, setSubscription] = useState<MySubscriptionRow | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [manualPixEnabled, setManualPixEnabled] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [canceling, setCanceling] = useState(false);

  const shouldShowManualPayment =
    manualPixEnabled && (subscription?.status === "manual_review" || subscription?.status === "pending");

  async function loadSubscription(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");
      setCopyMessage("");

      if (showRefreshing) {
        await syncMyMercadoPagoPaymentStatus();
      }

      const [data, capabilities, userPayments] = await Promise.all([
        getMyLatestSubscriptionRequest(),
        getBillingCapabilities(),
        getMyPayments().catch(() => []),
      ]);
      setManualPixEnabled(Boolean(capabilities.manualPixFallbackEnabled));
      setPayments(Array.isArray(userPayments) ? userPayments : []);

      if (!data) {
        setSubscription(null);
        return;
      }

      setSubscription({
        subscription_id: data.subscription_id,
        status: data.status,
        gateway: data.gateway ?? "manual",
        payment_url: data.payment_url,
        started_at: data.started_at,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        next_due_date: data.next_due_date,

        plan_id: data.plan_id ?? "",
        plan_slug: data.plan_slug ?? "",
        plan_name: data.plan_name ?? "Plano",
        plan_description: data.plan_description ?? null,
        plan_price_cents: data.plan_price_cents ?? 0,
      });
    } catch (error) {
      console.error("Erro inesperado ao carregar assinatura:", error);
      setErrorMessage("Ocorreu um erro inesperado ao carregar sua assinatura.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCancelSubscription() {
    if (!window.confirm("Cancelar próximas cobranças da assinatura? O acesso já pago será preservado até o fim do período.")) return;
    try {
      setCanceling(true);
      const result = await cancelMySubscription();
      if (result.outcome !== "success") {
        setErrorMessage(`Cancelamento ${result.outcome}: algumas cobranças ainda exigem reconciliação. Nossa equipe foi notificada; tente novamente em instantes.`);
      }
      await loadSubscription(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível cancelar a assinatura.");
    } finally {
      setCanceling(false);
    }
  }

  async function handleCopyPixKey() {
    if (!manualPaymentConfig.pixKey) return;

    try {
      await navigator.clipboard.writeText(manualPaymentConfig.pixKey);
      setCopyMessage("Chave Pix copiada.");
    } catch (error) {
      console.error("Erro ao copiar chave Pix:", error);
      setCopyMessage("Não foi possível copiar a chave Pix.");
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
            <span className="text-sm text-slate-200">
              Carregando assinatura...
            </span>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
          <Card className="w-full max-w-xl border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-600" />

            <h1 className="mt-4 text-2xl font-black text-red-900">
              Não foi possível carregar
            </h1>

            <p className="mt-2 text-sm text-red-700">{errorMessage}</p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login">
                <Button>Fazer login</Button>
              </Link>

              <Link href="/planos">
                <Button variant="outline">Ver planos</Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  if (!subscription) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-200">
              <Sparkles className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
              Você ainda não tem assinatura
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
              Escolha um plano para liberar o acesso ao banco de questões e aos
              recursos premium da plataforma.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/planos">
                <Button className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200">
                  Ver planos
                </Button>
              </Link>

              <Link href="/">
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Voltar ao início
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const statusInfo = getStatusInfo(subscription.status);
  const StatusIcon = statusInfo.icon;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <CreditCard className="h-4 w-4" />
            Minha assinatura
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Seu plano
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">
            Acompanhe o status da sua assinatura e o período de acesso.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/10 bg-white/[0.04] p-6 text-white">
            <div className={`rounded-2xl border p-4 ${statusInfo.className}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className="mt-0.5 h-5 w-5" />

                <div>
                  <h2 className="font-black">{statusInfo.title}</h2>
                  <p className="mt-1 text-sm leading-6">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
                Plano atual
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {subscription.plan_name}
              </h2>

              {subscription.plan_description && (
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {subscription.plan_description}
                </p>
              )}

              <div className="mt-6 text-4xl font-black text-white">
                {formatPriceFromCents(subscription.plan_price_cents)}
                <span className="ml-2 text-base font-medium text-slate-400">
                  / mês
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] p-6 text-white">
            <h2 className="text-xl font-black">Detalhes</h2>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">Status</span>
                <strong className="text-white">
                  {formatSubscriptionStatus(
                    subscription.status as BillingSubscriptionStatus
                  )}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">Gateway</span>
                <strong className="text-white">{formatGatewayLabel(subscription.gateway)}</strong>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">Início</span>
                <strong className="text-white">
                  {formatDate(subscription.started_at)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-slate-400">Vencimento</span>
                <strong className="text-white">
                  {formatDate(subscription.current_period_end)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Próxima cobrança</span>
                <strong className="text-white">
                  {formatDate(subscription.next_due_date)}
                </strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {subscription.status === "active" ? (
                <Link href="/banco-de-questoes">
                  <Button className="w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                    Acessar banco de questões
                  </Button>
                </Link>
              ) : (
                <Link href="/planos">
                  <Button className="w-full rounded-2xl bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                    Ver planos
                  </Button>
                </Link>
              )}

              {subscription.gateway === "mercadopago" && subscription.status === "active" && (
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="w-full rounded-2xl border-red-300/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                >
                  {canceling ? "Cancelando..." : "Cancelar próximas cobranças"}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => loadSubscription(true)}
                disabled={refreshing}
                className="w-full rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar status
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {payments.length > 0 && (
          <Card className="mx-auto mt-6 max-w-4xl border-white/10 bg-white/[0.04] p-6 text-white">
            <h2 className="text-xl font-black">Histórico de pagamentos</h2>
            <div className="mt-4 space-y-3">
              {payments.slice(0, 8).map((payment) => (
                <div key={payment.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-white">{formatPriceFromCents(Number(payment.amount_cents || 0))}</p>
                    <p className="text-xs text-slate-400">{formatGatewayLabel(payment.gateway)} • {payment.payment_method}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-slate-200">{payment.status}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {shouldShowManualPayment && (
          <Card className="mx-auto mt-6 max-w-4xl border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-50">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />

              <div>
                <h2 className="text-lg font-black text-white">
                  Falta confirmar o pagamento
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-100">
                  Para liberar seu acesso, faça o Pix e envie o comprovante pelo
                  WhatsApp. Depois disso, sua assinatura será aprovada no painel.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-bold text-white">Próximos passos</h3>

              <ol className="mt-3 space-y-2 text-sm leading-6 text-emerald-50">
                {manualPaymentConfig.instructions.map((instruction, index) => (
                  <li key={instruction} className="flex gap-2">
                    <span className="font-bold text-white">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>

              {manualPaymentConfig.pixKey && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                    Chave Pix
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <code className="break-all rounded-xl bg-black/30 px-3 py-2 text-sm text-white">
                      {manualPaymentConfig.pixKey}
                    </code>

                    <button
                      type="button"
                      onClick={handleCopyPixKey}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </button>
                  </div>

                  {copyMessage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-100">
                      {copyMessage}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {manualPaymentConfig.supportUrl && (
                  <a
                    href={manualPaymentConfig.supportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
                  >
                    {manualPaymentConfig.supportLabel}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <Link href="/planos">
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 sm:w-auto"
                  >
                    Ver planos
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}
