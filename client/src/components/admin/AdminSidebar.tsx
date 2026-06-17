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
  Box,
} from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Alunos e acessos", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/questoes", label: "Questões", icon: FileText },
  { href: "/admin/resolucoes", label: "Resoluções", icon: Blocks },
  { href: "/admin/reports", label: "Erros reportados", icon: MessageSquareWarning },
  { href: "/admin/uploads", label: "Uploads", icon: Image },
  { href: "/admin/vet", label: "VET", icon: BrainCircuit },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/matematica/geometria-espacial", label: "Geometria 3D", icon: Box },
];

export default function AdminSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3 border-b border-slate-100 px-3 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Painel ADM</h2>
            <p className="text-xs text-slate-500">Controle administrativo</p>
          </div>
        </div>

        <nav className="space-y-2">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const active =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
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
