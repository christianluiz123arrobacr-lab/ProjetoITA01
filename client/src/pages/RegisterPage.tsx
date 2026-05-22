import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

import PublicHeader from "@/components/layout/PublicHeader";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const registerMutation = trpc.auth.registerStudent.useMutation();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/planos");
    }
  }, [authLoading, isAuthenticated, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nomeTrimmed = nome.trim();
    const telefoneTrimmed = telefone.trim();
    const emailTrimmed = email.trim().toLowerCase();
    const senhaTrimmed = senha.trim();
    const confirmarSenhaTrimmed = confirmarSenha.trim();

    setErro("");
    setSuccess("");

    if (nomeTrimmed.length < 2) {
      setErro("Digite seu nome completo.");
      return;
    }

    if (telefoneTrimmed.length < 8) {
      setErro("Digite um telefone/WhatsApp válido.");
      return;
    }

    if (!emailTrimmed.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }

    if (senhaTrimmed.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senhaTrimmed !== confirmarSenhaTrimmed) {
      setErro("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);

      await registerMutation.mutateAsync({
        nome: nomeTrimmed,
        telefone: telefoneTrimmed,
        email: emailTrimmed,
        senha: senhaTrimmed,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: senhaTrimmed,
      });

      if (error) {
        setSuccess("Conta criada. Agora faça login para escolher seu plano.");
        navigate("/login");
        return;
      }

      if (data.session?.access_token) {
        localStorage.setItem("supabase_access_token", data.session.access_token);
      }

      navigate("/planos");
    } catch (error) {
      console.error("Erro ao criar conta:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua conta agora."
      );
    } finally {
      setLoading(false);
    }
  }

  const isSubmitting = loading || registerMutation.isPending;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_0.92fr] md:px-6">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
            <CheckCircle2 className="h-4 w-4" />
            Cadastro beta
          </div>

          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Crie sua conta antes de assinar.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
            Primeiro criamos seu acesso. Depois você escolhe o plano e finaliza
            o pagamento. Assim a assinatura fica vinculada ao seu usuário, em
            vez daquele caos maravilhoso de alguém pagar e o sistema não saber
            quem foi.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            {[
              "Banco de questões",
              "Explicações didáticas",
              "Simuladores",
              "Recursos em beta",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur md:p-8">
          <h2 className="text-2xl font-black">Criar conta</h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use um e-mail real, porque ele será usado para login e futura
            assinatura.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                Nome completo
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <User className="h-4 w-4 text-slate-400" />

                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">
                Telefone / WhatsApp
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <Phone className="h-4 w-4 text-slate-400" />

                <input
                  value={telefone}
                  onChange={(event) => setTelefone(event.target.value)}
                  placeholder="(66) 99999-9999"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

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
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200">
                  Confirmar senha
                </label>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                  <Lock className="h-4 w-4 text-slate-400" />

                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(event) => setConfirmarSenha(event.target.value)}
                    placeholder="Repita a senha"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
            </div>

            {erro && (
              <div className="flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100">
                {success}
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
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta e ver planos
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Já tem conta?{" "}
            <Link href="/login">
              <a className="font-bold text-cyan-200 hover:text-cyan-100">
                Fazer login
              </a>
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
