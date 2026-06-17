import { useEffect, useMemo, useState } from "react";
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

import PublicHeader from "@/components/layout/PublicHeader";
import {
  formatPlanPrice,
  loadPublicBillingPlans,
  PIX_PAYMENT_INFO,
  requestManualSubscription,
  type BillingPlan,
} from "@/services/billing.service";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type PlanIconName = "star" | "zap" | "crown";

type PlanVisual = {
  icon: PlanIconName;
  badge?: string;
  featured?: boolean;
  features: string[];
  limitFallback?: string;
};

const planVisuals: Record<string, PlanVisual> = {
  selecionado: {
    icon: "star",
    badge: "Acesso especial",
    limitFallback: "Somente para pessoas liberadas manualmente",
    features: [
      "Acesso à plataforma beta",
      "Explicações de Física e Matemática",
      "Simuladores disponíveis",
      "Banco de questões em evolução",
      "Participação no começo do projeto",
    ],
  },
  fundador: {
    icon: "zap",
    badge: "Mais estratégico",
    featured: true,
    features: [
      "Acesso à plataforma beta",
      "Banco de questões",
      "Explicações aprofundadas",
      "Simuladores interativos",
      "Atualizações constantes",
      "Preço promocional de fundador",
    ],
  },
  mensal: {
    icon: "crown",
    badge: "Plano normal",
    features: [
      "Acesso completo à plataforma",
      "Banco de questões",
      "Conteúdos de Física, Matemática e Química",
      "Simuladores",
      "Recursos futuros da plataforma",
    ],
  },
};

function getPlanVisual(plan: BillingPlan): PlanVisual {
  const slug = plan.slug.toLowerCase();

  if (slug.includes("fundador")) return planVisuals.fundador;
  if (slug.includes("mensal") || slug.includes("normal")) return planVisuals.mensal;
  return planVisuals.selecionado;
}

function PlanIcon({ icon }: { icon: PlanIconName }) {
  if (icon === "crown") return <Crown className="h-5 w-5" />;
  if (icon === "zap") return <Zap className="h-5 w-5" />;
  return <Star className="h-5 w-5" />;
}

function getUsagePercent(usedSlots: number, maxSlots: number) {
  if (!maxSlots || maxSlots <= 0) return 0;

  return Math.min(100, Math.round((usedSlots / maxSlots) * 100));
}

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
              Depois do pagamento, envie o comprovante para esse mesmo número.
              A liberação é feita manualmente durante esta fase beta.
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

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<BillingPlan | null>(null);
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");

  const isLoading = useMemo(
    () => authLoading || selectedPlan !== null,
    [authLoading, selectedPlan]
  );

  useEffect(() => {
    let mounted = true;

    async function loadPlans() {
      try {
        setPlansLoading(true);
        const loadedPlans = await loadPublicBillingPlans();

        if (mounted) {
          setPlans(loadedPlans);
        }
      } catch (error) {
        console.warn("Não foi possível carregar planos públicos:", error);
      } finally {
        if (mounted) setPlansLoading(false);
      }
    }

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubscribe(plan: BillingPlan) {
    setErro("");
    setSuccess("");

    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/cadastro");
      return;
    }

    if (plan.hasAvailableSlots === false) {
      setErro("Este plano atingiu o limite de vagas disponível no momento.");
      return;
    }

    try {
      setSelectedPlan(plan.slug);

      await requestManualSubscription(plan.slug);

      setSuccess(
        `Solicitação do plano "${plan.name}" registrada. Agora finalize o Pix e envie o comprovante.`
      );
      setPaymentPlan(plan);
    } catch (error) {
      console.error("Erro ao solicitar assinatura:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a assinatura agora."
      );
    } finally {
      setSelectedPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      {paymentPlan && (
        <PixPaymentModal
          plan={paymentPlan}
          onClose={() => setPaymentPlan(null)}
          onGoPending={() => navigate("/assinatura-pendente")}
        />
      )}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Acesso beta
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Escolha seu plano e libere o acesso à plataforma.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Crie sua conta, escolha o plano e finalize o pagamento por Pix. A
              solicitação fica vinculada ao seu usuário para liberação manual do
              acesso durante a fase beta.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {!isAuthenticated && !authLoading && (
                <Link href="/cadastro">
                  <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                    Criar conta antes de assinar
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              )}

              <Link href="/login">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                  Já tenho conta
                </a>
              </Link>
            </div>
          </div>

          {(erro || success) && (
            <div className="mx-auto mt-10 max-w-3xl">
              {erro && (
                <div className="flex gap-3 rounded-3xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm leading-6 text-red-100">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              {success && (
                <div className="flex gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm leading-6 text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>
          )}

          {plansLoading ? (
            <div className="mt-12 flex items-center justify-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando planos...
            </div>
          ) : (
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const currentLoading = selectedPlan === plan.slug;
                const visual = getPlanVisual(plan);
                const maxSlots = plan.maxActiveSubscriptions ?? null;
                const usedSlots = plan.usedSlots ?? 0;
                const remainingSlots = plan.remainingSlots ?? null;
                const usagePercent = maxSlots
                  ? getUsagePercent(usedSlots, maxSlots)
                  : 0;
                const isFull = plan.hasAvailableSlots === false;
                const limitText = maxSlots
                  ? `Limitado a ${maxSlots} assinaturas ativas/em análise`
                  : visual.limitFallback;

                return (
                  <article
                    key={plan.slug}
                    className={`relative flex min-h-full flex-col rounded-[2rem] border p-6 shadow-2xl backdrop-blur transition ${
                      visual.featured
                        ? "border-cyan-300/40 bg-cyan-300/[0.08] shadow-cyan-950/40"
                        : "border-white/10 bg-white/[0.06] shadow-slate-950/40"
                    }`}
                  >
                    {visual.featured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950">
                        recomendado
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          visual.featured
                            ? "bg-cyan-300 text-slate-950"
                            : "bg-white text-slate-950"
                        }`}
                      >
                        <PlanIcon icon={visual.icon} />
                      </div>

                      {visual.badge && (
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-200">
                          {visual.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-6">
                      <h2 className="text-2xl font-black text-white">
                        {plan.name}
                      </h2>

                      <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-8">
                      <p className="text-4xl font-black tracking-tight text-white">
                        {formatPlanPrice(plan.amountCents)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-400">
                        acesso mensal durante a fase beta
                      </p>
                    </div>

                    {limitText && (
                      <div
                        className={`mt-6 rounded-2xl border p-4 ${
                          isFull
                            ? "border-red-300/30 bg-red-400/10"
                            : "border-amber-300/20 bg-amber-300/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-sm font-black">
                          <span className={isFull ? "text-red-100" : "text-amber-100"}>
                            {isFull ? "Limite atingido" : limitText}
                          </span>
                        </div>

                        {maxSlots && (
                          <div className="mt-3">
                            <div className="mb-1 flex justify-between text-xs font-bold text-slate-200">
                              <span>{usedSlots}/{maxSlots} vagas preenchidas</span>
                              <span>{remainingSlots ?? 0} restantes</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
                              <div
                                className={`h-full rounded-full ${
                                  isFull ? "bg-red-300" : "bg-cyan-300"
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <ul className="mt-7 space-y-4 text-sm text-slate-300">
                      {visual.features.map((feature) => (
                        <li key={feature} className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-slate-950">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoading || isFull}
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        visual.featured
                          ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                          : "bg-white text-slate-950 hover:bg-slate-100"
                      }`}
                    >
                      {currentLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFull ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {isFull ? "Plano indisponível" : "Solicitar assinatura"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 md:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black text-white">
                Como funciona a liberação?
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["1", "Crie sua conta", "Nome, telefone, e-mail e senha ficam ligados ao seu usuário."],
                  ["2", "Escolha o plano", "A solicitação fica registrada na sua conta."],
                  ["3", "Acesso aprovado", "Depois da confirmação, a plataforma é liberada."],
                ].map(([number, title, text]) => (
                  <div
                    key={number}
                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">
                      {number}
                    </span>
                    <p className="mt-5 font-black text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 md:p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <MessageCircle className="h-7 w-7" />
              </div>

              <h2 className="text-2xl font-black text-white">
                Pagamento por Pix nesta fase beta
              </h2>

              <p className="mt-5 text-sm leading-7 text-emerald-50/85">
                Ao solicitar um plano, a plataforma mostra a chave Pix e o
                número para envio do comprovante. A liberação é manual enquanto
                o sistema de cobrança automática não estiver ativo.
              </p>

              <div className="mt-6 rounded-3xl border border-emerald-300/20 bg-slate-950/40 p-5">
                <p className="font-black text-emerald-100">Chave Pix / WhatsApp</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {PIX_PAYMENT_INFO.displayKey}
                </p>
                <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                  Envie o comprovante para esse número depois de fazer o Pix.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Lock className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">Acesso protegido</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  O acesso completo aos conteúdos, questões e simuladores depende
                  de uma assinatura ativa vinculada à conta do aluno. Planos vencidos
                  ou cancelados deixam de liberar a área interna automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
