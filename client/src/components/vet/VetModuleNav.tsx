import { Link, useLocation } from "wouter";
import {
  Target,
  Activity,
  BrainCircuit,
  BookOpen,
  Gauge,
  FileCheck,
  Dumbbell,
  BarChart3,
} from "lucide-react";

const items = [
  {
    href: "/vet/objetivo",
    label: "Objetivo",
    description: "Configure a régua",
    icon: Target,
  },
  {
    href: "/vet/diagnostico",
    label: "Diagnóstico",
    description: "Leia seu cenário",
    icon: Activity,
  },
  {
    href: "/vet/nivelamento",
    label: "Nivelamento",
    description: "Compare com a prova",
    icon: Gauge,
  },
  {
    href: "/vet/plano",
    label: "Plano VET",
    description: "Organize a execução",
    icon: BrainCircuit,
  },
  {
    href: "/vet/treino",
    label: "Treino",
    description: "Monte a rotina",
    icon: Dumbbell,
  },
  {
    href: "/vet/questoes",
    label: "Questões",
    description: "Resolva o recorte",
    icon: BookOpen,
  },
  {
    href: "/vet/simulado",
    label: "Simulado",
    description: "Teste a estratégia",
    icon: FileCheck,
  },
  {
    href: "/vet/analise-provas",
    label: "Análise das provas",
    description: "Explore a incidência",
    icon: BarChart3,
  },
];

function isActiveRoute(location: string, href: string) {
  if (href === "/vet/simulado") {
    return location === href || location.startsWith("/vet/simulado/");
  }

  return location === href;
}

export function VetModuleNav() {
  const [location] = useLocation();

  return (
    <section className="container pt-5">
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = isActiveRoute(location, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 min-w-[160px] rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-blue-600 dark:border-blue-500"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-xs font-bold opacity-70">
                    {index + 1}
                  </span>
                </div>

                <p className="text-sm font-bold leading-tight">{item.label}</p>

                <p
                  className={`text-xs mt-1 leading-snug ${
                    active ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
