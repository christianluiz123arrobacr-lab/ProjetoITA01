import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type VetPageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  backHref?: string;
};

export function VetPageHeader({
  title,
  subtitle,
  eyebrow = "VET",
  backHref = "/vet",
}: VetPageHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 dark:bg-slate-900/95 dark:border-slate-700">
        <div className="container py-4 flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
      </header>

      <section className="container pt-6">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 text-white shadow-lg shadow-emerald-100/60">
          <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-emerald-100 mb-2">
            {eyebrow}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            {title}
          </h2>
          <p className="text-sm md:text-base text-emerald-50 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>
    </>
  );
}
