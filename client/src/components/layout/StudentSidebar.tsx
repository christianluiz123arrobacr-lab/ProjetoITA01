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
  Moon,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { NOTEBOOK_FEATURE_AVAILABLE } from "@shared/featureAvailability";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-[60] hidden overflow-hidden flex-col border-r border-slate-200 bg-white text-slate-900 shadow-[4px_0_16px_rgba(15,23,42,0.06)] transition-[width] duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[4px_0_16px_rgba(2,6,23,0.35)] md:flex ${
        expanded ? "w-72" : "w-[76px]"
      }`}
    >
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
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
            <h2 className="truncate text-lg font-black text-slate-950 dark:text-slate-100">
              Projeto Vetor
            </h2>
          </div>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-5">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActiveRoute(location, item.href);

          const className = [
            "group relative flex h-12 items-center rounded-xl text-sm font-black transition-colors",
            expanded ? "justify-start gap-3 px-3" : "justify-center px-0",
            item.disabled
              ? "cursor-not-allowed text-slate-400 opacity-70"
              : active
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300",
          ].join(" ");

          const content = (
            <>
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-blue-700 dark:text-slate-400 dark:group-hover:text-blue-300"
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
        <div className="mx-4 mb-4 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <p className="px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Aparência
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Escolha de aparência">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Usar modo claro"
              aria-pressed={!isDark}
              className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-bold transition ${!isDark ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <Sun className="h-4 w-4" aria-hidden="true" /> Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Usar modo escuro"
              aria-pressed={isDark}
              className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-bold transition ${isDark ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <Moon className="h-4 w-4" aria-hidden="true" /> Escuro
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-700 dark:hover:text-blue-300"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      )}
    </aside>
  );
}
