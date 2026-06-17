import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  HelpCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function SubscriptionPendingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useSupabaseAuth();

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("supabase_access_token");
    navigate("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-100">
              <Clock className="h-4 w-4" />
              Assinatura pendente
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Sua conta está criada. Agora falta liberar o acesso.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Para acessar a plataforma completa, escolha um plano e finalize
              a assinatura. A liberação acontece quando o pagamento é confirmado
              e a assinatura fica vinculada à sua conta.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Conta criada</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Seu cadastro já está pronto para ser vinculado a um plano.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Pagamento pendente</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Escolha um plano para solicitar ou finalizar sua assinatura.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="font-black text-white">Acesso liberado depois</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Quando a assinatura for aprovada, o conteúdo fica disponível.
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

              <Link href="/login">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                  Fazer login
                </a>
              </Link>

              {!loading && isAuthenticated && (
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

            <h2 className="text-2xl font-black">O que acontece agora?</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                    1
                  </span>

                  <div>
                    <p className="font-black text-white">Escolha um plano</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Vá até a página de planos e selecione o acesso beta que
                      faz sentido para você.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                    2
                  </span>

                  <div>
                    <p className="font-black text-white">Finalize o pagamento</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Nesta fase inicial, a solicitação pode passar por
                      conferência manual antes da liberação do acesso.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                    3
                  </span>

                  <div>
                    <p className="font-black text-white">Acesse a plataforma</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Depois da liberação, você entra nas explicações, banco de
                      questões, simuladores e recursos do beta.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />

                <div>
                  <p className="font-black text-amber-100">
                    Já pagou e ainda não liberou?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-50/80">
                    Como essa etapa pode envolver conferência manual, pode existir
                    um intervalo entre o pagamento e a liberação do acesso.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" />

                <div>
                  <p className="font-black text-cyan-100">
                    Precisa de ajuda?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                    Use o contato informado na página de planos para avisar que
                    o pagamento foi feito ou tirar dúvida sobre a assinatura.
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
                O acesso aos conteúdos pagos é liberado somente após a ativação
                da assinatura vinculada à conta.
              </p>
            </div>

            <Link href="/planos">
              <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
                Escolher plano
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
