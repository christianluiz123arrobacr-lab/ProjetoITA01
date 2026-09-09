import { Link } from "wouter";
import { Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminTopbarProps = {
  title: string;
  subtitle: string;
};

export default function AdminTopbar({
  title,
  subtitle,
}: AdminTopbarProps) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 md:p-8 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-200" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-300">
              Administração
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            {subtitle}
          </p>
        </div>

        <Link href="/">
          <Button
            variant="outline"
            className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para o site
          </Button>
        </Link>
      </div>
    </div>
  );
}
