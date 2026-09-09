import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  FileText,
  Blocks,
  Image,
  BrainCircuit,
  ScrollText,
  ShieldCheck,
  MessageSquareWarning,
  CreditCard,
  Hand,
} from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Alunos e acessos", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/questoes", label: "Questões", icon: FileText },
  { href: "/admin/resolucoes", label: "Resoluções", icon: Blocks },
  {
    href: "/admin/reports",
    label: "Erros reportados",
    icon: MessageSquareWarning,
  },
  { href: "/admin/uploads", label: "Uploads", icon: Image },
  { href: "/admin/vet", label: "VET", icon: BrainCircuit },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  {
    href: "/admin/laboratorio-gestos",
    label: "Laboratório de Gestos",
    icon: Hand,
  },
];

export default function AdminSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 px-3 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Painel ADM
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle administrativo
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {adminItems.map(item => {
            const Icon = item.icon;
            const active =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href));

            // Full document navigation applies the camera policy scoped to this route.
            if (item.href === "/admin/laboratorio-gestos")
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 ${active ? "border-slate-700 bg-slate-900 text-white dark:bg-slate-700" : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"}`}
                >
                  <Hand className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs">
                      Controle simuladores com a câmera e movimentos da mão.
                    </span>
                  </span>
                </a>
              );
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-slate-900 dark:bg-slate-700 text-white"
                      : "border border-transparent bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
