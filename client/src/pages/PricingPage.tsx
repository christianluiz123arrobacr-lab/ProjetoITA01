import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { requestManualSubscription } from "@/services/billing.service";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";

type Plan = {
  slug: string;
  name: string;
  price: string;
  description: string;
  badge?: string;
  icon: "star" | "zap" | "crown";
  featured?: boolean;
  limited?: string;
  features: string[];
};

type FounderUsage = {
  plan_slug: string;
  used_slots: number;
  max_slots: number;
  remaining_slots: number;
};

const plans: Plan[] = [
  {
    slug: "beta-selecionado-5",
    name: "Beta selecionado",
    price: "R$ 5,00",
    description:
      "Plano especial para pessoas selecionadas que vão ajudar no começo do projeto.",
    badge: "Acesso especial",
    icon: "star",
    limited: "Somente para pessoas liberadas manualmente",
    features: [
      "Acesso à plataforma beta",
      "Explicações de Física e Matemática",
      "Simuladores disponíveis",
      "Banco de questões em evolução",
      "Participação no começo do projeto",
    ],
  },
  {
    slug: "beta-fundador-8",
    name: "Beta fundador",
    price: "R$ 8,00",
    description:
      "Plano inicial para os primeiros alunos que entrarem durante a fase beta.",
    badge: "Mais estratégico",
    icon: "zap",
    featured: true,
    limited: "Limitado aos primeiros 15 alunos",
    features: [
      "Acesso à plataforma beta",
      "Banco de questões",
      "Explicações aprofundadas",
      "Simuladores interativos",
      "Atualizações constantes",
      "Preço promocional de fundador",
    ],
  },
  {
    slug: "mensal-1099",
    name: "Plano mensal",
    price: "R$ 10,99",
    description:
      "Plano padrão para acesso mensal à plataforma quando o beta estiver mais estável.",
    badge: "Plano normal",
    icon: "crown",
    features: [
      "Acesso completo à plataforma",
      "Banco de questões",
      "Conteúdos de Física, Matemática e Química",
      "Simuladores",
      "Recursos futuros da plataforma",
    ],
  },
];

function PlanIcon({ icon }: { icon: Plan["icon"] }) {
  if (icon === "crown") return <Crown className="h-5 w-5" />;
  if (icon === "zap") return <Zap className="h-5 w-5" />;
  return <Star className="h-5 w-5" />;
}

function getUsagePercent(usedSlots: number, maxSlots: number) {
  if (!maxSlots || maxSlots <= 0) return 0;

  return Math.min(100, Math.round((usedSlots / maxSlots) * 100));
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");
  const [founderUsage, setFounderUsage] = useState<FounderUsage | null>(null);

  const isLoading = useMemo(
    () => authLoading || selectedPlan !== null,
    [authLoading, selectedPlan]
  );

  useEffect(() => {
    let mounted = true;

    async function loadFounderUsage() {
      const { data, error } = await supabase
        .rpc("get_fundador_plan_usage")
        .maybeSingle();

      if (error) {
        console.warn("Não foi possível carregar uso do plano fundador:", error);

        if (mounted) {
          setFounderUsage({
            plan_slug: "fundador_8",
            used_slots: 0,
            max_slots: 15,
            remaining_slots: 15,
          });
        }

        return;
      }

      if (mounted) {
        setFounderUsage(
          data ?? {
            plan_slug: "fundador_8",
            used_slots: 0,
            max_slots: 15,
            remaining_slots: 15,
          }
        );
      }
    }

    loadFounderUsage();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubscribe(plan: Plan) {
    setErro("");
    setSuccess("");

    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/cadastro");
      return;
    }

    try {
      setSelectedPlan(plan.slug);

      await requestManualSubscription(plan.slug);

      setSuccess(
        `Solicitação do plano "${plan.name}" enviada. Agora acompanhe a liberação da assinatura.`
      );

      setTimeout(() => {
        navigate("/assinatura-pendente");
      }, 900);
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
              Primeiro você cria sua conta. Depois escolhe o plano. Assim o
              acesso fica vinculado ao seu usuário, em vez de virar aquela caça
              ao tesouro patética de “quem pagou esse Pix aqui?”.
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

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const currentLoading = selectedPlan === plan.slug;
              const isFounderPlan = plan.slug === "beta-fundador-8";

              const usedSlots = founderUsage?.used_slots ?? 0;
              const maxSlots = founderUsage?.max_slots ?? 15;
              const remainingSlots = founderUsage?.remaining_slots ?? 15;
              const usagePercent = getUsagePercent(usedSlots, maxSlots);

              return (
                <article
                  key={plan.slug}
                  className={`relative flex min-h-full flex-col rounded-[2rem] border p-6 shadow-2xl backdrop-blur transition ${
                    plan.featured
                      ? "border-cyan-300/40 bg-cyan-300/[0.08] shadow-cyan-950/40"
                      : "border-white/10 bg-white/[0.06] shadow-slate-950/40"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950">
                      recomendado
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        plan.featured
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-white text-slate-950"
                      }`}
                    >
                      <PlanIcon icon={plan.icon} />
                    </div>

                    {plan.badge && (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-slate-200">
                        {plan.badge}
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

                  <div className="mt-6">
                    <p className="text-4xl font-black tracking-tight text-white">
                      {plan.price}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      acesso mensal durante a fase beta
                    </p>
                  </div>

                  {plan.limited && (
                    <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold leading-6 text-amber-100">
                      <p>{plan.limited}</p>

                      {isFounderPlan && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-amber-50/90">
                            <span>
                              {usedSlots}/{maxSlots} vagas preenchidas
                            </span>

                            <span>
                              {remainingSlots > 0
                                ? `${remainingSlots} restantes`
                                : "lotado"}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-950/50">
                            <div
                              className="h-full rounded-full bg-cyan-300 transition-all"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-slate-950">
                          <Check className="h-3.5 w-3.5" />
                        </span>

                        <span className="leading-6 text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSubscribe(plan)}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      plan.featured
                        ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                        : "bg-white text-slate-950 hover:bg-slate-100"
                    }`}
                  >
                    {currentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Solicitando...
                      </>
                    ) : isAuthenticated ? (
                      <>
                        Solicitar assinatura
                        <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Criar conta para assinar
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 md:p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-black">
                Como funciona a liberação?
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Crie sua conta",
                    text: "Nome, telefone, e-mail e senha ficam ligados ao seu usuário.",
                  },
                  {
                    title: "Escolha o plano",
                    text: "Você solicita o acesso beta pelo plano escolhido.",
                  },
                  {
                    title: "Acesso aprovado",
                    text: "Depois da aprovação, a plataforma é liberada para sua conta.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                      {index + 1}
                    </span>

                    <p className="mt-4 font-black text-white">{item.title}</p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 md:p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                <MessageCircle className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-black text-emerald-50">
                Pagamento nesta fase beta
              </h2>

              <p className="mt-4 text-sm leading-7 text-emerald-50/80">
                Nesta primeira etapa, a solicitação pode ser conferida
                manualmente. Depois vamos ligar isso ao Asaas com cobrança e
                webhook automático, porque eventualmente a humanidade precisa
                parar de aprovar assinatura no braço.
              </p>

              <div className="mt-6 rounded-3xl border border-emerald-200/20 bg-slate-950/30 p-5">
                <p className="text-sm font-black text-emerald-100">
                  Depois de solicitar o plano:
                </p>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-50/80">
                  <li className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0" />
                    acompanhe a tela de assinatura pendente;
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0" />
                    finalize o pagamento conforme a orientação do beta;
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0" />
                    aguarde a liberação do acesso na sua conta.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                  <Lock className="h-4 w-4" />
                  Acesso protegido
                </div>

                <h2 className="text-2xl font-black text-white">
                  Conta sem assinatura ativa não entra no conteúdo pago.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  O aluno pode criar conta normalmente, mas só entra na
                  plataforma depois da assinatura ser ativada. Simples,
                  profissional e menos propenso a virar incêndio no WhatsApp.
                </p>
              </div>

              <Link href="/assinatura-pendente">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                  Ver tela de pendência
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
