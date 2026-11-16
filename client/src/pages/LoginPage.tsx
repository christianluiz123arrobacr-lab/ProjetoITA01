import { checkoutReturn } from "@/lib/checkoutReturn";
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

import PublicHeader from "@/components/billing/CommerceHeader";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { bounded } from "@shared/authRecovery";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const returnTo = checkoutReturn(window.location.search, "/plataforma");
  const {
    isAuthenticated,
    loading: authLoading,
    error: authError,
    retry: retrySession,
  } = useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !authError && isAuthenticated) {
      navigate(returnTo);
    }
  }, [authLoading, authError, isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Preencha seu e-mail e sua senha para continuar.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const { error } = await bounded(
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        }),
        15000
      );

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
            "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada antes de acessar a plataforma."
          );
          return;
        }

        setErrorMessage(error.message || "Não foi possível acessar sua conta.");
        return;
      }

      navigate(returnTo);
    } catch (error) {
      setErrorMessage(
        "Ocorreu um erro inesperado ao tentar acessar sua conta. Tente novamente em instantes."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="commerce-surface min-h-screen bg-background text-foreground">
        <PublicHeader />

        <section className="flex  items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>

            <h1 className="text-xl font-black">Verificando acesso</h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Estamos conferindo sua sessão para direcionar você corretamente.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (authError)
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        role="alert"
      >
        <div>
          <p>
            Não foi possível carregar sua sessão. Tente novamente em instantes.
          </p>
          <button onClick={() => void retrySession()}>Tentar novamente</button>
        </div>
      </main>
    );

  return (
    <main className="commerce-surface min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid  max-w-6xl items-center gap-10 px-4 py-8  md:px-6 md:py-16">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl backdrop-blur md:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30">
                  <LogIn className="h-7 w-7" />
                </div>

                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                  Login
                </p>

                <h1 className="mt-2 text-3xl font-black">
                  Entrar na plataforma
                </h1>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Informe o e-mail e a senha cadastrados para acessar sua conta.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-800 dark:text-red-100">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-foreground">
                    E-mail
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-cyan-300/70">
                    <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />

                    <input
                      type="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="seuemail@exemplo.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-foreground">
                    Senha
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition focus-within:border-cyan-300/70">
                    <LockKeyhole className="h-5 w-5 shrink-0 text-muted-foreground" />

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={event => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(current => !current)}
                      className="rounded-xl p-1 text-muted-foreground transition hover:bg-card hover:text-foreground"
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

              <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-center">
                <p className="text-sm leading-6 text-muted-foreground">
                  Ainda não possui uma conta?
                </p>

                <Link
                  href={
                    "/cadastro?returnTo=" +
                    encodeURIComponent(
                      returnTo === "/plataforma" ? "/planos" : returnTo
                    )
                  }
                >
                  <a className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-300 transition hover:text-cyan-800 dark:text-cyan-100">
                    Criar conta
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link href="/planos">
                  <a className="text-xs font-bold text-muted-foreground transition hover:text-foreground">
                    Ver planos disponíveis
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
