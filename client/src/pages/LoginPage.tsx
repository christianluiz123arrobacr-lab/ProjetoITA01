import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn,
  Mail,
  UserPlus,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/fisica");
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const emailTrimmed = email.trim().toLowerCase();
    const senhaTrimmed = senha.trim();

    setErro("");

    if (!emailTrimmed.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }

    if (senhaTrimmed.length < 6) {
      setErro("Digite sua senha corretamente.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: senhaTrimmed,
      });

      if (error) {
        setErro(
          error.message ||
            "Não foi possível fazer login. Verifique e-mail e senha."
        );
        return;
      }

      if (data.session?.access_token) {
        localStorage.setItem("supabase_access_token", data.session.access_token);
      }

      navigate("/fisica");
    } catch (error) {
      console.error("Erro ao fazer login:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível fazer login agora."
      );
    } finally {
      setLoading(false);
    }
  }

  const isSubmitting = loading;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_0.9fr] md:px-6">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
            <BookOpen className="h-4 w-4" />
            Área do aluno
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Entre na sua conta e continue seus estudos.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
            Use o e-mail e a senha cadastrados para acessar a plataforma. Se
            você ainda não criou conta, faça o cadastro primeiro e depois escolha
            seu plano. Olha só, um fluxo minimamente civilizado.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="font-black text-white">Conta criada</p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Entre com seu e-mail e senha para acessar sua área.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                <UserPlus className="h-5 w-5" />
              </div>

              <p className="font-black text-white">Ainda não tem conta?</p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Crie sua conta, escolha o plano e finalize a assinatura beta.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/cadastro">
              <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                Criar conta agora
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <LogIn className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-black">Fazer login</h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Acesse com o e-mail usado no cadastro.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                E-mail
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                Senha
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <Lock className="h-4 w-4 text-slate-400" />

                <input
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Sua senha"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar na plataforma
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm leading-6 text-slate-300">
              Ainda não tem conta?{" "}
              <Link href="/cadastro">
                <a className="font-black text-cyan-200 hover:text-cyan-100">
                  Criar conta e assinar
                </a>
              </Link>
              .
            </p>
          </div>

          <div className="mt-4 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
            <p className="text-sm leading-6 text-amber-50/90">
              Se você criou conta, mas ainda não tem acesso, provavelmente falta
              finalizar ou aprovar a assinatura. O sistema não está sendo mau,
              só está fazendo o trabalho dele, pela primeira vez na história.
            </p>

            <Link href="/assinatura-pendente">
              <a className="mt-3 inline-flex items-center gap-2 text-sm font-black text-amber-100 hover:text-amber-50">
                Ver assinatura pendente
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
