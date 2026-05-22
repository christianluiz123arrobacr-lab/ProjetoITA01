import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Menu,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type NavItem = {
  label: string;
  href: string;
};

const publicNavItems: NavItem[] = [
  {
    label: "Início",
    href: "/",
  },
  {
    label: "Planos",
    href: "/planos",
  },
];

export default function PublicHeader() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, isAuthenticated } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }

    return location.startsWith(href);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/">
          <a
            onClick={closeMobile}
            className="group flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/20 transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>

            <div className="leading-tight">
              <p className="text-base font-black tracking-tight text-slate-950">
                Rumo ao ITA
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Plataforma beta
              </p>
            </div>
          </a>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  isActive(item.href)
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-10 w-40 animate-pulse rounded-full bg-slate-100" />
          ) : isAuthenticated ? (
            <>
              <Link href="/planos">
                <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950">
                  <Sparkles className="h-4 w-4" />
                  Planos
                </a>
              </Link>

              <Link href="/fisica">
                <a className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition-transform hover:scale-[1.02]">
                  <LayoutDashboard className="h-4 w-4" />
                  Ir para plataforma
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </a>
              </Link>

              <Link href="/cadastro">
                <a className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition-transform hover:scale-[1.02]">
                  <UserPlus className="h-4 w-4" />
                  Criar conta
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="space-y-2">
            {publicNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={closeMobile}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-colors ${
                    isActive(item.href)
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Link>
            ))}
          </nav>

          <div className="mt-4 grid gap-2">
            {loading ? (
              <div className="h-11 animate-pulse rounded-2xl bg-slate-100" />
            ) : isAuthenticated ? (
              <>
                <Link href="/planos">
                  <a
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ver planos
                  </a>
                </Link>

                <Link href="/fisica">
                  <a
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Ir para plataforma
                  </a>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </a>
                </Link>

                <Link href="/cadastro">
                  <a
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                    Criar conta e assinar
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
