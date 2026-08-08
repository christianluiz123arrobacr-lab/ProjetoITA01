import type { ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Box,
  BrainCircuit,
  Home,
  Menu,
  NotebookPen,
  Trophy,
  X,
} from "lucide-react";
import { NOTEBOOK_FEATURE_AVAILABLE } from "@shared/featureAvailability";

type StudentSidebarProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

type StudentNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const navItems: StudentNavItem[] = [
  { label: "Início", href: "/plataforma", icon: Home },
  { label: "Banco de questões", href: "/banco-de-questoes", icon: BookOpen },
  { label: "Caderno", href: "/caderno", icon: NotebookPen, disabled: !NOTEBOOK_FEATURE_AVAILABLE },
  { label: "Caderno de erros", href: "/caderno-de-erros", icon: BookMarked },
  { label: "VET", href: "/vet", icon: BrainCircuit },
  { label: "Ranking", href: "/ranking", icon: Trophy },
  { label: "Progresso", href: "/progress", icon: BarChart3 },
  { label: "Simuladores", href: "/simuladores", icon: Box },
];

function isActiveRoute(currentPath: string, targetPath: string) {
  if (targetPath === "/plataforma") {
    return currentPath === "/plataforma";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function StudentSidebar({
  expanded,
  onExpandedChange,
}: StudentSidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-blue-100 bg-white text-slate-900 shadow-[8px_0_24px_rgba(15,23,42,0.08)] transition-[width] duration-200 md:flex ${
        expanded ? "w-72" : "w-[76px]"
      }`}
    >
      <div className="flex h-20 items-center gap-3 border-b border-blue-50 px-4">
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
          aria-label={expanded ? "Fechar menu lateral" : "Abrir menu lateral"}
          title={expanded ? "Fechar menu" : "Abrir menu"}
        >
          {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {expanded ? (
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Plataforma
            </p>
            <h2 className="truncate text-lg font-black text-slate-950">
              Projeto Vetor
            </h2>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3 py-5">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActiveRoute(location, item.href);

          const className = [
            "group relative flex h-12 items-center rounded-2xl text-sm font-black transition-all",
            expanded ? "justify-start gap-3 px-3" : "justify-center px-0",
            item.disabled
              ? "cursor-not-allowed text-slate-400 opacity-70"
              : active
              ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
          ].join(" ");

          const content = (
            <>
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-blue-700"
                }`}
              />

              {expanded ? (
                <><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.disabled ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Em desenvolvimento</span> : null}</>
              ) : null}
            </>
          );

          if (item.disabled) return (
            <div key={item.href} className={className} title="Caderno — em desenvolvimento" aria-disabled="true">
              {content}
            </div>
          );

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={className}
                title={!expanded ? item.label : undefined}
              >
                {content}
              </a>
            </Link>
          );
        })}
      </nav>

      {expanded ? (
        <div className="mx-4 mb-4 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Acesso rápido
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
            Navegue entre estudo, desempenho, revisões e VET sem voltar para a
            página inicial.
          </p>
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500" />
        </div>
      )}
    </aside>
  );
}
