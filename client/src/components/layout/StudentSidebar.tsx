import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Box,
  BookOpen,
  BookMarked,
  BrainCircuit,
  ChevronLeft,
  Home,
  Menu,
  Trophy,
  X,
} from "lucide-react";

type StudentNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
};

const navItems: StudentNavItem[] = [
  { label: "Início", href: "/plataforma", icon: Home },
  { label: "Banco de questões", href: "/banco-de-questoes", icon: BookOpen },
  { label: "Caderno de erros", href: "/caderno-de-erros", icon: BookMarked },
  { label: "VET", href: "/vet", icon: BrainCircuit },
  { label: "Ranking", href: "/ranking", icon: Trophy },
  { label: "Progresso", href: "/progress", icon: BarChart3 },
  { label: "Simuladores", href: "/simuladores", icon: Box, soon: true },
];

function isActiveRoute(currentPath: string, targetPath: string) {
  if (targetPath === "/plataforma") {
    return currentPath === "/plataforma";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function StudentSidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const [location] = useLocation();

  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <BrainCircuit className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Plataforma
          </p>
          <h2 className="text-lg font-black leading-tight text-slate-950">
            Domine Exatas
          </h2>
        </div>
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = !item.soon && isActiveRoute(location, item.href);

          const className = [
            "group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition-all",
            item.soon
              ? "cursor-not-allowed border border-dashed border-slate-200 bg-slate-50 text-slate-400"
              : active
                ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
          ].join(" ");

          const content = (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    active
                      ? "text-cyan-200"
                      : item.soon
                        ? "text-slate-300"
                        : "text-slate-500 group-hover:text-slate-900"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>

              {item.soon ? (
                <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Em breve
                </span>
              ) : null}
            </>
          );

          if (item.soon) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                className={className}
                aria-disabled="true"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <a className={className} onClick={onNavigate}>
                {content}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
          Acesso rápido
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
          Use o menu para alternar entre estudo, desempenho e revisão sem voltar
          para a página inicial.
        </p>
      </div>
    </aside>
  );
}

function StudentSidebarRail({ onOpen }: { onOpen: () => void }) {
  const [location] = useLocation();

  return (
    <aside className="fixed bottom-5 left-5 top-5 z-40 hidden w-[72px] flex-col items-center rounded-[1.75rem] border border-slate-800 bg-slate-950/95 px-2 py-3 text-white shadow-2xl shadow-slate-950/25 backdrop-blur-xl lg:flex">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
        aria-label="Abrir menu completo"
        title="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
        <BrainCircuit className="h-5 w-5" />
      </div>

      <nav className="mt-6 flex flex-1 flex-col items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = !item.soon && isActiveRoute(location, item.href);

          const className = [
            "relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
            item.soon
              ? "cursor-not-allowed text-slate-600"
              : active
                ? "bg-white text-blue-600 shadow-lg shadow-black/20"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
          ].join(" ");

          const content = (
            <>
              {active ? (
                <span className="absolute -right-2 h-7 w-1 rounded-full bg-blue-400" />
              ) : null}
              <Icon className="h-5 w-5" />
              {item.soon ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-slate-500" />
              ) : null}
            </>
          );

          if (item.soon) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                className={className}
                aria-label={`${item.label} em breve`}
                title={`${item.label} - Em breve`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <a className={className} aria-label={item.label} title={item.label}>
                {content}
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function StudentSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/20 transition hover:bg-slate-800 lg:hidden"
        aria-label="Abrir menu da plataforma"
      >
        <Menu className="h-5 w-5" />
      </button>

      <StudentSidebarRail onOpen={() => setOpen(true)} />

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm lg:bg-slate-950/20"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />

          <div className="absolute bottom-0 left-0 top-0 w-[min(22rem,88vw)] p-4 lg:bottom-5 lg:left-5 lg:top-5 lg:w-72 lg:p-0">
            <StudentSidebarContent onNavigate={() => setOpen(false)} />
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-xl"
            aria-label="Fechar menu da plataforma"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-[min(23rem,90vw)] hidden rounded-full bg-white/95 px-3 py-2 text-xs font-black text-slate-600 shadow-xl min-[430px]:flex lg:left-80">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Menu
          </div>
        </div>
      ) : null}
    </>
  );
}
