import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/plataforma");
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Preencha e-mail e senha para entrar.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const message = error.message.toLowerCase();

        if (
          message.includes("invalid login credentials") ||
          message.includes("invalid credentials")
        ) {
          setErrorMessage("E-mail ou senha incorretos.");
          return;
        }

        if (message.includes("email not confirmed")) {
          setErrorMessage(
            "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
          );
          return;
        }

        setErrorMessage(error.message || "Não foi possível entrar na conta.");
        return;
      }

      if (data.session?.access_token) {
        localStorage.setItem("supabase_access_token", data.session.access_token);
      }

      navigate("/plataforma");
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      setErrorMessage(
        "Aconteceu um erro inesperado ao tentar entrar. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <PublicHeader />

        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <h1 className="text-xl font-black">Verificando sessão</h1>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Estamos conferindo se você já está logado.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950" />
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-16">
          <div className="hidden md:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
              <Rocket className="h-4 w-4" />
              Rumo ao ITA
            </div>

            <h1 className="max-w-xl text-5xl font-black tracking-tight">
              Entre na sua conta e continue estudando.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Depois do login, você vai para a página inicial real da plataforma:
              Física, Matemática, Química, banco de questões, progresso,
              ranking e as ferramentas do projeto. Não para o seletor de Física,
              porque finalmente estamos tratando rota como coisa séria.
            </p>

            <div className="mt-8 grid max-w-xl gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-200" />

                  <div>
                    <p className="font-black text-white">
                      Acesso protegido por assinatura
                    </p>

                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Se sua assinatura estiver ativa, você entra direto na
                      plataforma. Se estiver vencida ou pendente, o sistema manda
                      para a página de assinatura pendente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-amber-200" />

                  <div>
                    <p className="font-black text-white">
                      Sem login, sem bagunça
                    </p>

                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Usuário sem conta vê a página pública. Usuário com conta
                      entra. Usuário sem assinatura fica bloqueado. Simples,
                      direto e menos propenso a virar uma novela técnica.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur md:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30">
                  <LogIn className="h-7 w-7" />
                </div>

                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                  Login
                </p>

                <h1 className="mt-2 text-3xl font-black">
                  Entrar na plataforma
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Use seu e-mail e senha cadastrados para acessar sua conta.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">
                    E-mail
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 transition focus-within:border-cyan-300/70">
                    <Mail className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-200">
                    Senha
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 transition focus-within:border-cyan-300/70">
                    <LockKeyhole className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="rounded-xl p-1 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center">
                <p className="text-sm leading-6 text-slate-300">
                  Ainda não tem conta?
                </p>

                <Link href="/cadastro">
                  <a className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-black text-cyan-200 transition hover:text-cyan-100">
                    Criar conta
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link href="/planos">
                  <a className="text-xs font-bold text-slate-400 transition hover:text-slate-200">
                    Ver planos beta
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
