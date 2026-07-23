import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Home,
  LogIn,
  Menu,
  UserCircle2,
  X,
} from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loading, isAuthenticated } = useSupabaseAuth();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 text-white shadow-xl backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href={isAuthenticated ? "/plataforma" : "/"}>
          <a
            onClick={closeMenu}
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <img src="/brand/projeto-vetor-logo.svg" alt="Projeto Vetor" className="h-10 w-10 rounded-full object-cover shadow-lg shadow-cyan-950/30" />

            <div className="leading-tight">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
                Projeto Vetor
              </p>
              <p className="text-xs font-semibold text-slate-400">
                Plataforma beta
              </p>
            </div>
          </a>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {!isAuthenticated && (
            <Link href="/">
              <a className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
                <Home className="h-4 w-4" />
                Início
              </a>
            </Link>
          )}

          <Link href="/planos">
            <a className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
              <CreditCard className="h-4 w-4" />
              Planos
            </a>
          </Link>

          {isAuthenticated && (
            <Link href="/plataforma">
              <a className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
                <BookOpen className="h-4 w-4" />
                Plataforma
              </a>
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-36 animate-pulse rounded-2xl bg-white/[0.08]" />
          ) : isAuthenticated ? (
            <>
              <Link href="/plataforma">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                  Ir para plataforma
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>

              <Link href="/perfil">
                <a className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1]">
                  <UserCircle2 className="h-5 w-5" />
                </a>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.1]">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </a>
              </Link>

              <Link href="/cadastro">
                <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                  Criar conta
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1] md:hidden"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {!isAuthenticated && (
              <Link href="/">
                <a
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  <Home className="h-4 w-4" />
                  Início
                </a>
              </Link>
            )}

            <Link href="/planos">
              <a
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"
              >
                <CreditCard className="h-4 w-4" />
                Planos
              </a>
            </Link>

            {loading ? (
              <div className="h-12 animate-pulse rounded-2xl bg-white/[0.08]" />
            ) : isAuthenticated ? (
              <>
                <Link href="/plataforma">
                  <a
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                  >
                    <BookOpen className="h-4 w-4" />
                    Ir para plataforma
                  </a>
                </Link>

                <Link href="/perfil">
                  <a
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Ver perfil
                  </a>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </a>
                </Link>

                <Link href="/cadastro">
                  <a
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Criar conta
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
